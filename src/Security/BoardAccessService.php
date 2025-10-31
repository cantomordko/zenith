<?php

namespace App\Security;

use App\Entity\Board;
use App\Entity\BoardMembership;
use App\Entity\User;
use App\Repository\BoardMembershipRepository;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

class BoardAccessService
{
    public function __construct(private readonly BoardMembershipRepository $membershipRepository)
    {
    }

    public function assertCanAccess(Board $board, User $user): BoardMembership
    {
        $membership = $this->membershipRepository->findMembership($board, $user);
        if (!$membership) {
            throw new AccessDeniedException('Nie masz dostępu do tej tablicy.');
        }

        return $membership;
    }

    public function assertCanManage(Board $board, User $user): BoardMembership
    {
        $membership = $this->assertCanAccess($board, $user);
        if (!in_array($membership->getRole(), [BoardMembership::ROLE_OWNER, BoardMembership::ROLE_ADMIN], true)) {
            throw new AccessDeniedException('Brak uprawnień do zarządzania tablicą.');
        }

        return $membership;
    }
}
