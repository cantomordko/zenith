<?php

namespace App\Repository;

use App\Entity\Board;
use App\Entity\BoardMembership;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BoardMembership>
 */
class BoardMembershipRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BoardMembership::class);
    }

    public function findMembership(Board $board, User $user): ?BoardMembership
    {
        return $this->createQueryBuilder('m')
            ->andWhere('m.board = :board')
            ->andWhere('m.user = :user')
            ->setParameter('board', $board)
            ->setParameter('user', $user)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
