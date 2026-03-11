<?php

namespace App\Repository;

use App\Entity\Board;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Board>
 */
class BoardRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Board::class);
    }

    /**
     * @return Board[]
     */
    public function findByMember(User $user): array
    {
        return $this->createQueryBuilder('b')
            ->join('b.memberships', 'm')
            ->andWhere('m.user = :user')
            ->setParameter('user', $user)
            ->orderBy('b.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findOneBySlugWithSnapshot(string $slug): ?Board
    {
        return $this->createSnapshotQueryBuilder()
            ->andWhere('b.slug = :slug')
            ->setParameter('slug', $slug)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findOneByIdWithSnapshot(int $id): ?Board
    {
        return $this->createSnapshotQueryBuilder()
            ->andWhere('b.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();
    }

    private function createSnapshotQueryBuilder()
    {
        return $this->createQueryBuilder('b')
            ->distinct()
            ->leftJoin('b.memberships', 'memberships')
            ->addSelect('memberships')
            ->leftJoin('memberships.user', 'memberUser')
            ->addSelect('memberUser')
            ->leftJoin('b.columns', 'columns')
            ->addSelect('columns')
            ->leftJoin('columns.cards', 'cards')
            ->addSelect('cards')
            ->leftJoin('cards.assignees', 'assignees')
            ->addSelect('assignees')
            ->orderBy('columns.position', 'ASC')
            ->addOrderBy('cards.position', 'ASC')
            ->addOrderBy('memberships.id', 'ASC');
    }
}
