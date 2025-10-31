<?php

namespace App\Service;

use App\Entity\Board;
use DateTimeImmutable;
use Predis\Client;
use Predis\ClientInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class RealtimeUpdateStore
{
    private const LIST_TTL_SECONDS = 43200;
    private const LIST_MAX_LENGTH = 200;
    private const DEFAULT_RETRY_MS = 3000;

    private ?ClientInterface $client = null;
    private bool $connectionFailed = false;

    public function __construct(
        #[Autowire(env: 'REDIS_DSN')]
        #[\SensitiveParameter]
        private readonly string $redisDsn,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function recordEvent(Board $board, array $payload): void
    {
        $client = $this->getClient();
        if ($client === null) {
            return;
        }

        try {
            $boardId = $board->getId();
            $sequenceKey = $this->sequenceKey($boardId);
            $eventId = (int) $client->incr($sequenceKey);

            $envelope = $payload;
            $envelope['id'] = $eventId;
            $envelope['createdAt'] = (new DateTimeImmutable())->format(DATE_ATOM);

            $encoded = json_encode($envelope, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
            $eventsKey = $this->eventsKey($boardId);

            $client->rpush($eventsKey, [$encoded]);
            $client->ltrim($eventsKey, -self::LIST_MAX_LENGTH, -1);
            $client->expire($eventsKey, self::LIST_TTL_SECONDS);

            if (array_key_exists('snapshot', $payload)) {
                $snapshotEncoded = json_encode($payload['snapshot'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
                $client->setex($this->snapshotKey($boardId), self::LIST_TTL_SECONDS, $snapshotEncoded);
            }
        } catch (\Throwable $exception) {
            $this->logger->error('Failed to record board update in Redis.', [
                'boardId' => $board->getId(),
                'event' => $payload['event'] ?? 'unknown',
                'exception' => $exception,
            ]);
        }
    }

    public function fetchUpdates(int $boardId, ?int $sinceId = null): array
    {
        $client = $this->getClient();
        if ($client === null) {
            return [
                'events' => [],
                'latestId' => $sinceId,
                'retry' => self::DEFAULT_RETRY_MS,
            ];
        }

        try {
            $eventsKey = $this->eventsKey($boardId);
            $range = $sinceId === null ? $client->lrange($eventsKey, -1, -1) : $client->lrange($eventsKey, 0, -1);

            $events = [];
            $latestId = $sinceId ?? 0;

            foreach ($range as $encoded) {
                $decoded = $this->decodeJson($encoded);
                if (!is_array($decoded)) {
                    continue;
                }

                $eventId = isset($decoded['id']) ? (int) $decoded['id'] : 0;
                if ($sinceId !== null && $eventId <= $sinceId) {
                    continue;
                }

                $events[] = $decoded;
                if ($eventId > $latestId) {
                    $latestId = $eventId;
                }
            }

            if ($latestId === 0) {
                $latest = $this->getLatestSequence($boardId);
                if ($latest !== null) {
                    $latestId = $latest;
                }
            }

            return [
                'events' => $events,
                'latestId' => $latestId > 0 ? $latestId : null,
                'retry' => self::DEFAULT_RETRY_MS,
            ];
        } catch (\Throwable $exception) {
            $this->logger->error('Failed to fetch board updates from Redis.', [
                'boardId' => $boardId,
                'exception' => $exception,
            ]);

            return [
                'events' => [],
                'latestId' => $sinceId,
                'retry' => self::DEFAULT_RETRY_MS,
            ];
        }
    }

    public function getLatestSequence(int $boardId): ?int
    {
        $client = $this->getClient();
        if ($client === null) {
            return null;
        }

        $value = $client->get($this->sequenceKey($boardId));
        if ($value === null) {
            return null;
        }

        return (int) $value;
    }

    public function getSnapshot(int $boardId): ?array
    {
        $client = $this->getClient();
        if ($client === null) {
            return null;
        }

        $encoded = $client->get($this->snapshotKey($boardId));
        if ($encoded === null) {
            return null;
        }

        $decoded = $this->decodeJson($encoded);
        return is_array($decoded) ? $decoded : null;
    }

    private function getClient(): ?ClientInterface
    {
        if ($this->client instanceof ClientInterface) {
            return $this->client;
        }

        if ($this->connectionFailed) {
            return null;
        }

        $dsn = trim($this->redisDsn);
        if ($dsn === '') {
            $this->connectionFailed = true;
            $this->logger->warning('REDIS_DSN is not configured; real-time updates are disabled.');
            return null;
        }

        try {
            $this->client = $this->createClient($dsn);
        } catch (\Throwable $exception) {
            $this->connectionFailed = true;
            $this->logger->error('Unable to connect to Redis.', [
                'dsn' => $this->anonymiseDsn($dsn),
                'exception' => $exception,
            ]);

            return null;
        }

        return $this->client;
    }

    private function createClient(string $dsn): ClientInterface
    {
        $configuration = $this->normaliseDsn($dsn);

        return new Client($configuration);
    }

    private function normaliseDsn(string $dsn): array|string
    {
        $dsn = trim($dsn);

        if ($dsn === '') {
            return [];
        }

        if (str_starts_with($dsn, '/')) {
            return [
                'scheme' => 'unix',
                'path' => $dsn,
            ];
        }

        if (!str_contains($dsn, '://')) {
            return [
                'scheme' => 'tcp',
                'host' => $dsn,
            ];
        }

        $parts = parse_url($dsn);
        if ($parts === false) {
            return $dsn;
        }

        $query = [];
        if (isset($parts['query'])) {
            parse_str($parts['query'], $query);
        }

        $scheme = $parts['scheme'] ?? 'tcp';

        if ($scheme === 'unix' || (($parts['host'] ?? '') === '' && isset($parts['path']) && str_starts_with($parts['path'], '/'))) {
            $config = [
                'scheme' => 'unix',
                'path' => $parts['path'] ?? '',
            ];
        } else {
            $config = [
                'scheme' => $scheme === 'redis' ? 'tcp' : $scheme,
                'host' => $parts['host'] ?? '127.0.0.1',
                'port' => isset($parts['port']) ? (int) $parts['port'] : 6379,
            ];
        }

        if (isset($parts['user']) || isset($parts['pass'])) {
            $config['password'] = $parts['pass'] ?? $parts['user'];
        }

        if (isset($query['db'])) {
            $config['database'] = (int) $query['db'];
        } elseif (($config['scheme'] ?? '') !== 'unix' && isset($parts['path']) && $parts['path'] !== '') {
            $db = ltrim($parts['path'], '/');
            if ($db !== '') {
                $config['database'] = (int) $db;
            }
        }

        if (isset($query['timeout'])) {
            $config['timeout'] = (float) $query['timeout'];
        }

        if (isset($query['read_timeout'])) {
            $config['read_write_timeout'] = (float) $query['read_timeout'];
        }

        return $config;
    }

    private function anonymiseDsn(string $dsn): string
    {
        if (!str_contains($dsn, '@')) {
            return $dsn;
        }

        return (string) preg_replace('/:(.*?)@/', ':***@', $dsn);
    }

    private function decodeJson(string $payload): mixed
    {
        try {
            return json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            return null;
        }
    }

    private function eventsKey(int $boardId): string
    {
        return sprintf('board:%d:events', $boardId);
    }

    private function sequenceKey(int $boardId): string
    {
        return sprintf('board:%d:seq', $boardId);
    }

    private function snapshotKey(int $boardId): string
    {
        return sprintf('board:%d:snapshot', $boardId);
    }
}
