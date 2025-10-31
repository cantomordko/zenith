<?php

namespace App\Controller;

use App\Entity\Board;
use App\Entity\User;
use App\Repository\BoardRepository;
use App\Repository\TimeEntryRepository;
use App\Security\BoardAccessService;
use App\Service\BoardSerializer;
use App\Service\RealtimeUpdateStore;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/boards')]
class BoardController extends AbstractController
{
    public function __construct(
        private readonly BoardRepository $boardRepository,
        private readonly BoardSerializer $boardSerializer,
        private readonly BoardAccessService $boardAccess,
        private readonly TimeEntryRepository $timeEntryRepository,
        private readonly RealtimeUpdateStore $updateStore,
    ) {
    }

    #[Route('', name: 'app_board_index', methods: ['GET'])]
    public function index(): Response
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        $boards = $this->boardRepository->findByMember($user);

        return $this->render('board/index.html.twig', [
            'boards' => $boards,
        ]);
    }

    #[Route('/{slug}', name: 'app_board_show', methods: ['GET'])]
    public function show(string $slug): Response
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        /** @var Board|null $board */
        $board = $this->boardRepository->findOneBy(['slug' => $slug]);
        if (!$board) {
            throw $this->createNotFoundException('Nie znaleziono tablicy.');
        }

        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        $this->boardAccess->assertCanAccess($board, $user);

        $boardPayload = $this->boardSerializer->serializeBoard($board);

        $updatesCursor = $this->updateStore->getLatestSequence($board->getId());

        return $this->render('board/show.html.twig', [
            'board' => $board,
            'boardData' => $boardPayload,
            'boardDataJson' => json_encode($boardPayload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            'updatesUrl' => $this->generateUrl('api_board_updates', ['id' => $board->getId()]),
            'updatesCursor' => $updatesCursor,
        ]);
    }

    #[Route('/{slug}/worklog', name: 'app_board_worklog', methods: ['GET'])]
    public function worklog(string $slug, Request $request): Response
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        /** @var Board|null $board */
        $board = $this->boardRepository->findOneBy(['slug' => $slug]);
        if (!$board) {
            throw $this->createNotFoundException('Nie znaleziono tablicy.');
        }

        /** @var \App\Entity\User $user */
        $user = $this->getUser();
            $deadlineSoonMinutes = 24 * 60;

        // Pobierz parametry filtrowania
        $dateFrom = $request->query->get('date_from');
        $dateTo = $request->query->get('date_to');
        $selectedUserId = $request->query->get('user_id');
        $selectedUserId = is_numeric($selectedUserId) ? (int) $selectedUserId : null;

        // Pobierz wszystkie time entries dla tablicy
        $timeEntries = $this->timeEntryRepository->findByBoard(
            $board,
            $dateFrom ? new \DateTimeImmutable($dateFrom) : null,
            $dateTo ? new \DateTimeImmutable($dateTo) : null,
            $selectedUserId
        );

        // Oblicz statystyki
        $totalMinutes = 0;
        $entriesByUser = [];
        $entriesByCard = [];

        $now = new \DateTimeImmutable();
        $deadlineSoonMinutes = 24 * 60;

        foreach ($timeEntries as $entry) {
            $totalMinutes += $entry->getMinutesSpent();

            $authorId = $entry->getAuthor()->getId();
            if (!isset($entriesByUser[$authorId])) {
                $entriesByUser[$authorId] = [
                    'user' => $entry->getAuthor(),
                    'minutes' => 0,
                    'entries' => [],
                ];
            }
            $entriesByUser[$authorId]['minutes'] += $entry->getMinutesSpent();
            $entriesByUser[$authorId]['entries'][] = $entry;

            $cardId = $entry->getCard()->getId();
            if (!isset($entriesByCard[$cardId])) {
                $entriesByCard[$cardId] = [
                    'card' => $entry->getCard(),
                    'minutes' => 0,
                    'entries' => [],
                ];
            }
            $entriesByCard[$cardId]['minutes'] += $entry->getMinutesSpent();
            $entriesByCard[$cardId]['entries'][] = $entry;
        }

        $cardOverruns = [];
        foreach ($entriesByCard as $cardId => &$cardSummary) {
            $card = $cardSummary['card'];
            $estimate = $card->getEstimatedMinutes();
            $trackedTotal = $card->calculateTotalTrackedMinutes();
            $overrun = $estimate !== null && $estimate > 0 && $trackedTotal > $estimate;
            $overrunMinutes = $overrun ? $trackedTotal - $estimate : 0;

            $dueAt = $card->getDueAt();
            $deadlineStatus = null;
            if ($dueAt instanceof \DateTimeInterface) {
                if ($dueAt < $now) {
                    $deadlineStatus = 'overdue';
                } else {
                    $diffMinutes = (int) floor(($dueAt->getTimestamp() - $now->getTimestamp()) / 60);
                    if ($diffMinutes <= $deadlineSoonMinutes) {
                        $deadlineStatus = 'warning';
                    } else {
                        $deadlineStatus = 'scheduled';
                    }
                }
            }

            $cardSummary['estimatedMinutes'] = $estimate;
            $cardSummary['trackedTotal'] = $trackedTotal;
            $cardSummary['overrun'] = $overrun;
            $cardSummary['overrunMinutes'] = $overrunMinutes;
            $cardSummary['deadlineStatus'] = $deadlineStatus;
            $cardSummary['dueAt'] = $dueAt;

            $cardOverruns[$cardId] = [
                'overrun' => $overrun,
                'estimatedMinutes' => $estimate,
                'trackedTotal' => $trackedTotal,
                'overrunMinutes' => $overrunMinutes,
                'deadlineStatus' => $deadlineStatus,
                'dueAt' => $dueAt,
            ];
        }
        unset($cardSummary);

        // Sortuj po czasie malejąco
        usort($entriesByUser, fn($a, $b) => $b['minutes'] <=> $a['minutes']);
        usort($entriesByCard, fn($a, $b) => $b['minutes'] <=> $a['minutes']);

        $boardMembers = [];
        $owner = $board->getOwner();
        if ($owner->getId() !== null) {
            $boardMembers[$owner->getId()] = $owner;
        }

        foreach ($board->getMemberships() as $membership) {
            $memberUser = $membership->getUser();
            if ($memberUser->getId() !== null) {
                $boardMembers[$memberUser->getId()] = $memberUser;
            }
        }

        usort($boardMembers, static fn(User $a, User $b) => strcasecmp($a->getDisplayName(), $b->getDisplayName()));

        return $this->render('board/worklog.html.twig', [
            'board' => $board,
            'timeEntries' => $timeEntries,
            'totalMinutes' => $totalMinutes,
            'entriesByUser' => $entriesByUser,
            'entriesByCard' => $entriesByCard,
            'cardOverruns' => $cardOverruns,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'selectedUserId' => $selectedUserId,
            'boardMembers' => $boardMembers,
        ]);
    }
}

