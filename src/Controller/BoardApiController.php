<?php

namespace App\Controller;

use App\Entity\Board;
use App\Entity\BoardColumn;
use App\Entity\BoardMembership;
use App\Entity\Card;
use App\Entity\CardComment;
use App\Entity\TimeEntry;
use App\Entity\User;
use App\Repository\BoardColumnRepository;
use App\Repository\BoardMembershipRepository;
use App\Repository\BoardRepository;
use App\Repository\CardRepository;
use App\Repository\UserRepository;
use App\Security\BoardAccessService;
use App\Service\BoardSerializer;
use App\Service\BoardUpdatePublisher;
use App\Service\RealtimeUpdateStore;
use DateTimeImmutable;
use JsonException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\String\Slugger\SluggerInterface;

#[Route('/api')]
class BoardApiController extends AbstractController
{
    private const DEFAULT_COLUMN_TITLES = [
        'Rejestr zadań',
        'Projektowanie',
        'Do zrobienia',
        'W trakcie',
        'Przegląd kodu',
        'Testowanie',
        'Ukończone 🎉',
    ];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly BoardRepository $boardRepository,
        private readonly BoardColumnRepository $columnRepository,
        private readonly BoardMembershipRepository $membershipRepository,
        private readonly CardRepository $cardRepository,
        private readonly UserRepository $userRepository,
        private readonly BoardSerializer $boardSerializer,
        private readonly BoardUpdatePublisher $updatePublisher,
        private readonly RealtimeUpdateStore $updateStore,
        private readonly BoardAccessService $boardAccess,
        private readonly SluggerInterface $slugger,
    ) {
    }

    #[Route('/boards', name: 'api_board_create', methods: ['POST'])]
    public function createBoard(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $data = $this->decodeJson($request);

        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '') {
            return $this->json(['error' => 'Nazwa tablicy jest wymagana.'], Response::HTTP_BAD_REQUEST);
        }

        /** @var User $user */
        $user = $this->getUser();

        $board = new Board();
        $board->setName($name);
        $board->setDescription($data['description'] ?? null);
        $board->setOwner($user);
        $board->setSlug($this->generateUniqueSlug($name));

        $membership = new BoardMembership();
        $membership->setBoard($board);
        $membership->setUser($user);
        $membership->setRole(BoardMembership::ROLE_OWNER);

    $this->em->persist($board);
    $this->em->persist($membership);

    $this->bootstrapDefaultColumns($board);

    $this->em->flush();

        $this->updatePublisher->publish($board, 'board.created', [
            'board' => $this->boardSerializer->serializeBoard($board),
        ]);

        return $this->json($this->boardSerializer->serializeBoard($board), Response::HTTP_CREATED);
    }

    #[Route('/boards/{id}', name: 'api_board_view', methods: ['GET'])]
    public function getBoard(Board $board): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        /** @var User $user */
        $user = $this->getUser();
        $this->boardAccess->assertCanAccess($board, $user);

        return $this->json($this->boardSerializer->serializeBoard($board));
    }

    #[Route('/boards/{id}/updates', name: 'api_board_updates', methods: ['GET'])]
    public function getBoardUpdates(Board $board, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        /** @var User $user */
        $user = $this->getUser();
        $this->boardAccess->assertCanAccess($board, $user);

        $sinceParam = $request->query->get('since');
        $sinceId = null;
        if ($sinceParam !== null && $sinceParam !== '') {
            if (!ctype_digit((string) $sinceParam)) {
                return $this->json(['error' => 'Parametr since musi być liczbą całkowitą.'], Response::HTTP_BAD_REQUEST);
            }
            $sinceId = (int) $sinceParam;
        }

        $updates = $this->updateStore->fetchUpdates($board->getId(), $sinceId);

        return $this->json($updates);
    }

    #[Route('/boards/{id}/columns', name: 'api_board_add_column', methods: ['POST'])]
    public function createColumn(Board $board, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        /** @var User $user */
        $user = $this->getUser();
        $this->boardAccess->assertCanManage($board, $user);

        $data = $this->decodeJson($request);
        $title = trim((string) ($data['title'] ?? ''));
        if ($title === '') {
            return $this->json(['error' => 'Nazwa kolumny jest wymagana.'], Response::HTTP_BAD_REQUEST);
        }

        $column = new BoardColumn();
        $column->setBoard($board);
        $column->setTitle($title);
        $column->setPosition($this->columnRepository->getNextPosition($board));

        $this->em->persist($column);
    $board->touch();
        $this->em->flush();

        $this->updatePublisher->publish($board, 'column.created', [
            'column' => $this->boardSerializer->serializeColumn($column),
        ]);

        return $this->json($this->boardSerializer->serializeColumn($column), Response::HTTP_CREATED);
    }

    #[Route('/columns/{id}', name: 'api_column_update', methods: ['PATCH'])]
    public function updateColumn(BoardColumn $column, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        /** @var User $user */
        $user = $this->getUser();
        $board = $column->getBoard();
        $this->boardAccess->assertCanManage($board, $user);

        $data = $this->decodeJson($request);
        if (isset($data['title'])) {
            $title = trim((string) $data['title']);
            if ($title === '') {
                return $this->json(['error' => 'Nazwa kolumny nie może być pusta.'], Response::HTTP_BAD_REQUEST);
            }
            $column->setTitle($title);
        }

        if (isset($data['position']) && is_numeric($data['position'])) {
            $this->reorderColumns($board, $column, (int) $data['position']);
        }

        $board->touch();
        $this->em->flush();

        $this->updatePublisher->publish($board, 'column.updated', [
            'column' => $this->boardSerializer->serializeColumn($column),
        ]);

        return $this->json($this->boardSerializer->serializeColumn($column));
    }

    #[Route('/boards/{id}/members', name: 'api_board_add_member', methods: ['POST'])]
    public function addMember(Board $board, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        /** @var User $actor */
        $actor = $this->getUser();
        $this->boardAccess->assertCanManage($board, $actor);

        $data = $this->decodeJson($request);

        $targetUser = null;
        if (isset($data['userId']) && is_numeric($data['userId'])) {
            $targetUser = $this->userRepository->find((int) $data['userId']);
        } elseif (isset($data['email'])) {
            $email = trim((string) $data['email']);
            if ($email !== '') {
                $targetUser = $this->userRepository->findOneByEmail($email);
            }
        }

        if (!$targetUser instanceof User) {
            return $this->json(['error' => 'Nie znaleziono użytkownika.'], Response::HTTP_BAD_REQUEST);
        }

        if ($this->membershipRepository->findMembership($board, $targetUser)) {
            return $this->json(['error' => 'Użytkownik już należy do tablicy.'], Response::HTTP_CONFLICT);
        }

        $role = BoardMembership::ROLE_MEMBER;
        if (isset($data['role'])) {
            $requestedRole = (string) $data['role'];
            $allowedRoles = [BoardMembership::ROLE_MEMBER, BoardMembership::ROLE_ADMIN];
            if (!in_array($requestedRole, $allowedRoles, true)) {
                return $this->json(['error' => 'Nieprawidłowa rola.'], Response::HTTP_BAD_REQUEST);
            }
            $role = $requestedRole;
        }

        $membership = new BoardMembership();
        $membership->setBoard($board);
        $membership->setUser($targetUser);
        $membership->setRole($role);
        if (array_key_exists('notificationsEnabled', $data)) {
            $membership->setNotificationsEnabled((bool) $data['notificationsEnabled']);
        }

        $board->addMembership($membership);

        $this->em->persist($membership);
        $board->touch();
        $this->em->flush();

        $memberPayload = [
            'id' => $targetUser->getId(),
            'displayName' => $targetUser->getDisplayName(),
            'role' => $role,
        ];

        $this->updatePublisher->publish($board, 'member.added', [
            'member' => $memberPayload,
        ]);

        return $this->json($memberPayload, Response::HTTP_CREATED);
    }

    #[Route('/boards/{id}/members/{userId}', name: 'api_board_remove_member', methods: ['DELETE'])]
    public function removeMember(Board $board, int $userId): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        /** @var User $actor */
        $actor = $this->getUser();
        $this->boardAccess->assertCanManage($board, $actor);

        $targetUser = $this->userRepository->find($userId);
        if (!$targetUser instanceof User) {
            return $this->json(['error' => 'Nie znaleziono użytkownika.'], Response::HTTP_NOT_FOUND);
        }

        $membership = $this->membershipRepository->findMembership($board, $targetUser);
        if (!$membership) {
            return $this->json(['error' => 'Użytkownik nie należy do tablicy.'], Response::HTTP_NOT_FOUND);
        }

        if ($membership->getRole() === BoardMembership::ROLE_OWNER) {
            return $this->json(['error' => 'Nie można usunąć właściciela tablicy.'], Response::HTTP_BAD_REQUEST);
        }

        $board->removeMembership($membership);
        $this->em->remove($membership);
        $board->touch();
        $this->em->flush();

        $this->updatePublisher->publish($board, 'member.removed', [
            'memberId' => $targetUser->getId(),
        ]);

        return $this->json(['status' => 'ok']);
    }

    #[Route('/boards/{id}', name: 'api_board_delete', methods: ['DELETE'])]
    public function deleteBoard(Board $board): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        /** @var User $actor */
        $actor = $this->getUser();
        $this->boardAccess->assertCanManage($board, $actor);

        $boardId = $board->getId();
        $this->em->remove($board);
        $this->em->flush();

        return $this->json(['status' => 'ok', 'boardId' => $boardId], Response::HTTP_OK);
    }

    #[Route('/columns/{id}', name: 'api_column_delete', methods: ['DELETE'])]
    public function deleteColumn(BoardColumn $column): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        /** @var User $user */
        $user = $this->getUser();
        $board = $column->getBoard();
        $this->boardAccess->assertCanManage($board, $user);

        $columnId = $column->getId();
    $board->removeColumn($column);
        $this->reindexColumns($board);
    $board->touch();
        $this->em->remove($column);
        $this->em->flush();

        $this->updatePublisher->publish($board, 'column.deleted', [
            'columnId' => $columnId,
        ]);

        return $this->json(['status' => 'ok']);
    }

    #[Route('/columns/{id}/cards', name: 'api_card_create', methods: ['POST'])]
    public function createCard(BoardColumn $column, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $board = $column->getBoard();
        /** @var User $user */
        $user = $this->getUser();
        $this->boardAccess->assertCanAccess($board, $user);

        $data = $this->decodeJson($request);
        $title = trim((string) ($data['title'] ?? ''));
        if ($title === '') {
            return $this->json(['error' => 'Nazwa karty jest wymagana.'], Response::HTTP_BAD_REQUEST);
        }

        $card = new Card();
        $card->setColumn($column);
        $card->setTitle($title);
        $card->setDescription($data['description'] ?? null);
        $card->setPosition($this->cardRepository->getNextPosition($column));

        if (!empty($data['dueAt'])) {
            $card->setDueAt($this->parseDate($data['dueAt']));
        }

        $card->setLabels(is_array($data['labels'] ?? null) ? $data['labels'] : []);

        if (array_key_exists('estimatedMinutes', $data)) {
            try {
                $card->setEstimatedMinutes($this->convertDurationToMinutes($data['estimatedMinutes']));
            } catch (BadRequestHttpException $exception) {
                return $this->json(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
            }
        }

        $this->assignUsersToCard($card, $data['assigneeIds'] ?? []);

        $this->em->persist($card);
    $board->touch();
        $this->em->flush();

        $this->updatePublisher->publish($board, 'card.created', [
            'columnId' => $column->getId(),
            'card' => $this->boardSerializer->serializeCard($card),
        ]);

        return $this->json($this->boardSerializer->serializeCard($card), Response::HTTP_CREATED);
    }

    #[Route('/cards/{id}', name: 'api_card_update', methods: ['PATCH'])]
    public function updateCard(Card $card, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $board = $card->getColumn()->getBoard();
        /** @var User $user */
        $user = $this->getUser();
        $this->boardAccess->assertCanAccess($board, $user);

        $data = $this->decodeJson($request);

        if (array_key_exists('title', $data)) {
            $title = trim((string) $data['title']);
            if ($title === '') {
                return $this->json(['error' => 'Nazwa karty nie może być pusta.'], Response::HTTP_BAD_REQUEST);
            }
            $card->setTitle($title);
        }

        if (array_key_exists('description', $data)) {
            $card->setDescription($data['description'] !== null ? (string) $data['description'] : null);
        }

        if (array_key_exists('dueAt', $data)) {
            $card->setDueAt($data['dueAt'] ? $this->parseDate($data['dueAt']) : null);
        }

        if (array_key_exists('labels', $data) && is_array($data['labels'])) {
            $card->setLabels($data['labels']);
        }

        if (array_key_exists('estimatedMinutes', $data)) {
            try {
                $card->setEstimatedMinutes($this->convertDurationToMinutes($data['estimatedMinutes']));
            } catch (BadRequestHttpException $exception) {
                return $this->json(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
            }
        }

        if (array_key_exists('archived', $data)) {
            $card->setArchived((bool) $data['archived']);
        }

        if (array_key_exists('assigneeIds', $data)) {
            $this->assignUsersToCard($card, $data['assigneeIds']);
        }

        $card->touch();
        $board->touch();
        $this->em->flush();

        $this->updatePublisher->publish($board, 'card.updated', [
            'card' => $this->boardSerializer->serializeCard($card),
        ]);

        return $this->json($this->boardSerializer->serializeCard($card));
    }

    #[Route('/cards/{id}/move', name: 'api_card_move', methods: ['PATCH'])]
    public function moveCard(Card $card, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $board = $card->getColumn()->getBoard();
        /** @var User $user */
        $user = $this->getUser();
        $this->boardAccess->assertCanAccess($board, $user);

        $data = $this->decodeJson($request);
        $targetColumnId = (int) ($data['targetColumnId'] ?? 0);
        $targetPosition = (int) ($data['targetPosition'] ?? 0);

        $targetColumn = $this->columnRepository->find($targetColumnId);
        if (!$targetColumn || $targetColumn->getBoard()->getId() !== $board->getId()) {
            return $this->json(['error' => 'Docelowa kolumna nie istnieje.'], Response::HTTP_BAD_REQUEST);
        }

        $sourceColumn = $card->getColumn();
        if ($sourceColumn->getId() !== $targetColumn->getId()) {
            $sourceColumn->removeCard($card);
            $targetColumn->addCard($card);
        }

        $this->reorderCards($targetColumn, $card, $targetPosition);
        if ($sourceColumn->getId() !== $targetColumn->getId()) {
            $this->reindexCards($sourceColumn);
        }

        $card->touch();
        $board->touch();
        $this->em->flush();

        $this->updatePublisher->publish($board, 'card.moved', [
            'card' => $this->boardSerializer->serializeCard($card),
            'sourceColumnId' => $sourceColumn->getId(),
            'targetColumnId' => $targetColumn->getId(),
        ]);

        return $this->json($this->boardSerializer->serializeCard($card));
    }

    #[Route('/cards/{id}', name: 'api_card_delete', methods: ['DELETE'])]
    public function deleteCard(Card $card): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $board = $card->getColumn()->getBoard();
        /** @var User $user */
        $user = $this->getUser();
        $this->boardAccess->assertCanManage($board, $user);

        $cardId = $card->getId();
        $column = $card->getColumn();
        $this->em->remove($card);
        $this->em->flush();

        $this->reindexCards($column);
        $this->em->flush();

        $this->updatePublisher->publish($board, 'card.deleted', [
            'cardId' => $cardId,
            'columnId' => $column->getId(),
        ]);

        return $this->json(['status' => 'ok']);
    }

    #[Route('/cards/{id}/comments', name: 'api_card_add_comment', methods: ['POST'])]
    public function addComment(Card $card, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $board = $card->getColumn()->getBoard();
        /** @var User $user */
        $user = $this->getUser();
        $this->boardAccess->assertCanAccess($board, $user);

        $data = $this->decodeJson($request);
        $content = trim((string) ($data['content'] ?? ''));
        if ($content === '') {
            return $this->json(['error' => 'Treść komentarza jest wymagana.'], Response::HTTP_BAD_REQUEST);
        }

        $comment = new CardComment();
        $comment->setAuthor($user);
        $comment->setCard($card);
        $comment->setContent($content);

        $this->em->persist($comment);
        $this->em->flush();

        $this->updatePublisher->publish($board, 'card.commented', [
            'cardId' => $card->getId(),
            'comments' => $this->boardSerializer->serializeComments($card),
        ]);

        return $this->json($this->boardSerializer->serializeComments($card), Response::HTTP_CREATED);
    }

    #[Route('/cards/{id}/time-entries', name: 'api_card_add_time_entry', methods: ['POST'])]
    public function addTimeEntry(Card $card, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $board = $card->getColumn()->getBoard();
        /** @var User $user */
        $user = $this->getUser();
        $this->boardAccess->assertCanAccess($board, $user);

        $data = $this->decodeJson($request);
        try {
            $minutes = $this->convertDurationToMinutes($data['minutes'] ?? null, true);
        } catch (BadRequestHttpException $exception) {
            return $this->json(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        $entry = new TimeEntry();
        $entry->setAuthor($user);
        $entry->setCard($card);
        $entry->setMinutesSpent($minutes);
        $entry->setNote($data['note'] ?? null);
        if (!empty($data['loggedAt'])) {
            $entry->setLoggedAt($this->parseDate($data['loggedAt']));
        }

        $this->em->persist($entry);
        $this->em->flush();

        $this->updatePublisher->publish($board, 'card.time_logged', [
            'cardId' => $card->getId(),
            'timeEntries' => $this->boardSerializer->serializeTimeEntries($card),
        ]);

        return $this->json($this->boardSerializer->serializeTimeEntries($card), Response::HTTP_CREATED);
    }

    #[Route('/cards/{id}', name: 'api_card_show', methods: ['GET'])]
    public function getCardDetails(Card $card): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $board = $card->getColumn()->getBoard();
        /** @var User $user */
        $user = $this->getUser();
        $this->boardAccess->assertCanAccess($board, $user);

        return $this->json([
            'card' => $this->boardSerializer->serializeCard($card),
            'comments' => $this->boardSerializer->serializeComments($card),
            'timeEntries' => $this->boardSerializer->serializeTimeEntries($card),
        ]);
    }

    private function decodeJson(Request $request): array
    {
        try {
            $payload = json_decode($request->getContent() ?: '[]', true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new BadRequestHttpException('Nieprawidłowy JSON.', $exception);
        }

        if (!is_array($payload)) {
            throw new BadRequestHttpException('Nieprawidłowy JSON.');
        }

        return $payload;
    }

    private function parseDate(string $value): DateTimeImmutable
    {
        return new DateTimeImmutable($value);
    }

    private function assignUsersToCard(Card $card, mixed $assigneeIds): void
    {
        if (!is_array($assigneeIds)) {
            if ($assigneeIds === null) {
                foreach ($card->getAssignees()->toArray() as $existing) {
                    $card->removeAssignee($existing);
                }
            }
            return;
        }

        foreach ($card->getAssignees()->toArray() as $existing) {
            $card->removeAssignee($existing);
        }

        if ($assigneeIds === []) {
            return;
        }

        $board = $card->getColumn()->getBoard();

        foreach ($assigneeIds as $id) {
            if (!is_numeric($id)) {
                continue;
            }
            $user = $this->userRepository->find((int) $id);
            if (!$user) {
                continue;
            }
            if (!$this->membershipRepository->findMembership($board, $user)) {
                continue;
            }
            $card->addAssignee($user);
        }
    }

    private function convertDurationToMinutes(mixed $value, bool $required = false): ?int
    {
        if ($value === null) {
            if ($required) {
                throw new BadRequestHttpException('Czas jest wymagany.');
            }

            return null;
        }

        if (is_int($value) || is_float($value)) {
            $minutes = (int) round((float) $value);
            if ($minutes <= 0) {
                if ($required) {
                    throw new BadRequestHttpException('Czas musi być dodatni.');
                }

                return null;
            }

            return $minutes;
        }

        if (!is_string($value)) {
            throw new BadRequestHttpException('Nieprawidłowy format czasu.');
        }

        $trimmed = strtolower(trim($value));
        if ($trimmed === '') {
            if ($required) {
                throw new BadRequestHttpException('Czas jest wymagany.');
            }

            return null;
        }

        if (is_numeric($trimmed)) {
            return $this->convertDurationToMinutes((int) round((float) $trimmed), $required);
        }

        $pattern = '/^(?:(\d+)\s*h(?:ours?)?)?\s*(?:(\d+)\s*m(?:in(?:ute)?s?)?)?$/';
        if (preg_match($pattern, $trimmed, $matches)) {
            $hours = isset($matches[1]) && $matches[1] !== '' ? (int) $matches[1] : 0;
            $minutes = isset($matches[2]) && $matches[2] !== '' ? (int) $matches[2] : 0;
            $total = ($hours * 60) + $minutes;
            if ($total <= 0) {
                if ($required) {
                    throw new BadRequestHttpException('Czas musi być dodatni.');
                }

                return null;
            }

            return $total;
        }

        if (preg_match('/^(\d+):(\d{1,2})$/', $trimmed, $matches)) {
            $hours = (int) $matches[1];
            $minutes = (int) $matches[2];
            $total = ($hours * 60) + $minutes;
            if ($total <= 0) {
                if ($required) {
                    throw new BadRequestHttpException('Czas musi być dodatni.');
                }

                return null;
            }

            return $total;
        }

        throw new BadRequestHttpException('Nieprawidłowy format czasu. Użyj np. 2h 30m.');
    }

    private function bootstrapDefaultColumns(Board $board): void
    {
        if ($board->getColumns()->count() > 0) {
            return;
        }

        foreach (self::DEFAULT_COLUMN_TITLES as $index => $title) {
            $column = (new BoardColumn())
                ->setTitle($title)
                ->setPosition($index);

            $board->addColumn($column);
            $this->em->persist($column);
        }
    }

    private function reorderColumns(Board $board, BoardColumn $column, int $targetPosition): void
    {
        $targetPosition = max(0, $targetPosition);
        $columns = $board->getColumns()->toArray();
        usort($columns, static fn (BoardColumn $a, BoardColumn $b) => $a->getPosition() <=> $b->getPosition());

        $columns = array_filter($columns, static fn (BoardColumn $c) => $c->getId() !== $column->getId());
        array_splice($columns, $targetPosition, 0, [$column]);
        foreach ($columns as $index => $col) {
            $col->setPosition($index);
        }
    }

    private function reorderCards(BoardColumn $targetColumn, Card $card, int $targetPosition): void
    {
        $targetPosition = max(0, $targetPosition);
        $cards = $targetColumn->getCards()->toArray();
        usort($cards, static fn (Card $a, Card $b) => $a->getPosition() <=> $b->getPosition());

        $cards = array_filter($cards, static fn (Card $c) => $c->getId() !== $card->getId());
        array_splice($cards, $targetPosition, 0, [$card]);
        foreach ($cards as $index => $c) {
            $c->setPosition($index);
        }
    }

    private function reindexCards(BoardColumn $column): void
    {
        $cards = $column->getCards()->toArray();
        usort($cards, static fn (Card $a, Card $b) => $a->getPosition() <=> $b->getPosition());
        foreach ($cards as $index => $card) {
            $card->setPosition($index);
        }
    }

    private function reindexColumns(Board $board): void
    {
        $columns = $board->getColumns()->toArray();
        usort($columns, static fn (BoardColumn $a, BoardColumn $b) => $a->getPosition() <=> $b->getPosition());
        foreach ($columns as $index => $column) {
            $column->setPosition($index);
        }
    }

    private function generateUniqueSlug(string $name): string
    {
        $base = strtolower($this->slugger->slug($name)->toString() ?: 'board');
        $slug = $base;
        $counter = 1;
        while ($this->boardRepository->findOneBy(['slug' => $slug])) {
            $slug = sprintf('%s-%d', $base, ++$counter);
        }

        return $slug;
    }
}
