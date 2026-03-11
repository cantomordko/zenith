<?php

namespace App\Repository;

use App\Entity\Board;
use App\Entity\TimeEntry;
use DateTimeInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TimeEntry>
 */
class TimeEntryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TimeEntry::class);
    }

    /**
     * @return TimeEntry[]
     */
    public function findByBoard(
        Board $board,
        ?DateTimeInterface $dateFrom = null,
        ?DateTimeInterface $dateTo = null,
        ?int $userId = null
    ): array {
        $qb = $this->createQueryBuilder('te')
            ->addSelect('author', 'c', 'col')
            ->innerJoin('te.author', 'author')
            ->innerJoin('te.card', 'c')
            ->innerJoin('c.column', 'col')
            ->innerJoin('col.board', 'b')
            ->where('b.id = :boardId')
            ->setParameter('boardId', $board->getId())
            ->orderBy('te.loggedAt', 'DESC');

        if ($dateFrom) {
            $qb->andWhere('te.loggedAt >= :dateFrom')
               ->setParameter('dateFrom', $dateFrom);
        }

        if ($dateTo) {
            $qb->andWhere('te.loggedAt <= :dateTo')
               ->setParameter('dateTo', $dateTo);
        }

        if ($userId !== null) {
            $qb->andWhere('IDENTITY(te.author) = :userId')
               ->setParameter('userId', $userId);
        }

        return $qb->getQuery()->getResult();
    }

    public function getTrackedMinutesByBoard(Board $board): array
    {
        $rows = $this->createQueryBuilder('te')
            ->select('card.id AS cardId, COALESCE(SUM(te.minutesSpent), 0) AS trackedMinutes')
            ->innerJoin('te.card', 'card')
            ->innerJoin('card.column', 'boardColumn')
            ->andWhere('boardColumn.board = :board')
            ->setParameter('board', $board)
            ->groupBy('card.id')
            ->getQuery()
            ->getArrayResult();

        $totals = [];
        foreach ($rows as $row) {
            $totals[(int) $row['cardId']] = (int) $row['trackedMinutes'];
        }

        return $totals;
    }
}

