<?php

namespace App\Repository;

use App\Entity\Board;
use App\Entity\Card;
use App\Entity\User;
use App\Entity\BoardColumn;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Card>
 */
class CardRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Card::class);
    }

    /**
     * @return Card[]
     */
    public function findByBoard(Board $board): array
    {
        return $this->createQueryBuilder('card')
            ->join('card.column', 'column')
            ->andWhere('column.board = :board')
            ->setParameter('board', $board)
            ->orderBy('column.position', 'ASC')
            ->addOrderBy('card.position', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Card[]
     */
    public function findAssignedToUser(User $user): array
    {
        return $this->createQueryBuilder('card')
            ->join('card.assignees', 'assignee')
            ->andWhere('assignee = :user')
            ->setParameter('user', $user)
            ->orderBy('card.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getNextPosition(BoardColumn $column): int
    {
        $maxPosition = $this->createQueryBuilder('card')
            ->select('MAX(card.position)')
            ->andWhere('card.column = :column')
            ->setParameter('column', $column)
            ->getQuery()
            ->getSingleScalarResult();

        return $maxPosition !== null ? ((int) $maxPosition + 1) : 0;
    }

    public function getBoardCardMetrics(Board $board): array
    {
        $metrics = [];

        $commentRows = $this->createQueryBuilder('card')
            ->select('card.id AS cardId, COUNT(comment.id) AS commentCount')
            ->innerJoin('card.column', 'boardColumn')
            ->leftJoin('card.comments', 'comment')
            ->andWhere('boardColumn.board = :board')
            ->setParameter('board', $board)
            ->groupBy('card.id')
            ->getQuery()
            ->getArrayResult();

        foreach ($commentRows as $row) {
            $metrics[(int) $row['cardId']] = [
                'commentCount' => (int) $row['commentCount'],
                'trackedMinutes' => 0,
            ];
        }

        $trackedRows = $this->createQueryBuilder('card')
            ->select('card.id AS cardId, COALESCE(SUM(timeEntry.minutesSpent), 0) AS trackedMinutes')
            ->innerJoin('card.column', 'boardColumn')
            ->leftJoin('card.timeEntries', 'timeEntry')
            ->andWhere('boardColumn.board = :board')
            ->setParameter('board', $board)
            ->groupBy('card.id')
            ->getQuery()
            ->getArrayResult();

        foreach ($trackedRows as $row) {
            $cardId = (int) $row['cardId'];
            $metrics[$cardId] ??= [
                'commentCount' => 0,
                'trackedMinutes' => 0,
            ];
            $metrics[$cardId]['trackedMinutes'] = (int) $row['trackedMinutes'];
        }

        return $metrics;
    }
}
