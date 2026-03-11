<?php

namespace App\Service;

use App\Entity\Board;
use App\Repository\BoardRepository;
use App\Repository\CardRepository;

class BoardSnapshotProvider
{
    public function __construct(
        private readonly BoardRepository $boardRepository,
        private readonly CardRepository $cardRepository,
        private readonly BoardSerializer $boardSerializer,
    ) {
    }

    public function createPayload(Board $board): array
    {
        return $this->boardSerializer->serializeBoard($board, $this->cardRepository->getBoardCardMetrics($board));
    }

    public function createPayloadByBoardId(int $boardId): ?array
    {
        $board = $this->boardRepository->findOneByIdWithSnapshot($boardId);
        if (!$board instanceof Board) {
            return null;
        }

        return $this->createPayload($board);
    }
}