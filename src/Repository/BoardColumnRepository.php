<?php

namespace App\Repository;

use App\Entity\Board;
use App\Entity\BoardColumn;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BoardColumn>
 */
class BoardColumnRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BoardColumn::class);
    }

    /**
     * @return BoardColumn[]
     */
    public function findByBoard(Board $board): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.board = :board')
            ->setParameter('board', $board)
            ->orderBy('c.position', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function getNextPosition(Board $board): int
    {
        $maxPosition = $this->createQueryBuilder('c')
            ->select('MAX(c.position)')
            ->andWhere('c.board = :board')
            ->setParameter('board', $board)
            ->getQuery()
            ->getSingleScalarResult();

        return $maxPosition !== null ? ((int) $maxPosition + 1) : 0;
    }
}
