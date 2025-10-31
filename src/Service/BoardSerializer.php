<?php

namespace App\Service;

use App\Entity\Board;
use App\Entity\BoardColumn;
use App\Entity\BoardMembership;
use App\Entity\Card;
use App\Entity\CardComment;
use App\Entity\TimeEntry;
use App\Entity\User;

class BoardSerializer
{
    public function serializeBoard(Board $board): array
    {
        return [
            'id' => $board->getId(),
            'name' => $board->getName(),
            'slug' => $board->getSlug(),
            'description' => $board->getDescription(),
            'updatedAt' => $board->getUpdatedAt()->format(DATE_ATOM),
            'columns' => $board->getColumns()->map(fn (BoardColumn $column) => $this->serializeColumn($column))->toArray(),
            'members' => $board->getMemberships()->map(fn (BoardMembership $membership) => [
                'id' => $membership->getUser()->getId(),
                'displayName' => $membership->getUser()->getDisplayName(),
                'role' => $membership->getRole(),
            ])->toArray(),
        ];
    }

    public function serializeColumn(BoardColumn $column): array
    {
        return [
            'id' => $column->getId(),
            'title' => $column->getTitle(),
            'position' => $column->getPosition(),
            'cards' => $column->getCards()->map(fn (Card $card) => $this->serializeCard($card))->toArray(),
        ];
    }

    public function serializeCard(Card $card): array
    {
        return [
            'id' => $card->getId(),
            'title' => $card->getTitle(),
            'description' => $card->getDescription(),
            'position' => $card->getPosition(),
            'dueAt' => $card->getDueAt()?->format(DATE_ATOM),
            'labels' => $card->getLabels(),
            'assignees' => $card->getAssignees()->map(fn (User $user) => [
                'id' => $user->getId(),
                'displayName' => $user->getDisplayName(),
            ])->toArray(),
            'commentCount' => $card->getComments()->count(),
            'estimatedMinutes' => $card->getEstimatedMinutes(),
            'trackedMinutes' => $card->calculateTotalTrackedMinutes(),
            'archived' => $card->isArchived(),
        ];
    }

    public function serializeComments(Card $card): array
    {
        return $card->getComments()->map(fn (CardComment $comment) => [
            'id' => $comment->getId(),
            'author' => [
                'id' => $comment->getAuthor()->getId(),
                'displayName' => $comment->getAuthor()->getDisplayName(),
            ],
            'content' => $comment->getContent(),
            'createdAt' => $comment->getCreatedAt()->format(DATE_ATOM),
        ])->toArray();
    }

    public function serializeTimeEntries(Card $card): array
    {
        return $card->getTimeEntries()->map(fn (TimeEntry $entry) => [
            'id' => $entry->getId(),
            'author' => [
                'id' => $entry->getAuthor()->getId(),
                'displayName' => $entry->getAuthor()->getDisplayName(),
            ],
            'minutesSpent' => $entry->getMinutesSpent(),
            'note' => $entry->getNote(),
            'loggedAt' => $entry->getLoggedAt()->format(DATE_ATOM),
        ])->toArray();
    }
}
