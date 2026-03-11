<?php

namespace App\Service;

use App\Entity\Board;
use Psr\Log\LoggerInterface;

class BoardUpdatePublisher
{
    public function __construct(
        private readonly RealtimeUpdateStore $realtimeStore,
        private readonly BoardSnapshotProvider $boardSnapshotProvider,
        private readonly BoardSerializer $serializer,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function publish(Board $board, string $event, array $context = []): void
    {
        $snapshot = $board->getId() !== null
            ? $this->boardSnapshotProvider->createPayloadByBoardId($board->getId())
            : null;

        $payload = [
            'event' => $event,
            'boardId' => $board->getId(),
            'payload' => $context,
            'snapshot' => $snapshot ?? $this->serializer->serializeBoard($board),
        ];

        try {
            $this->realtimeStore->recordEvent($board, $payload);
        } catch (\Throwable $exception) {
            $this->logger->error('Failed to persist board update in Redis.', [
                'boardId' => $board->getId(),
                'event' => $event,
                'exception' => $exception,
            ]);
        }
    }
}
