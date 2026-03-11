<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class AccountController extends AbstractController
{
    #[Route('/account/profile', name: 'app_account_profile_update', methods: ['POST'])]
    public function updateProfile(Request $request, EntityManagerInterface $entityManager): RedirectResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        if (!$this->isCsrfTokenValid('profile_update', (string) $request->request->get('_csrf_token'))) {
            $this->addFlash('error', 'Sesja wygasła. Odśwież stronę i spróbuj ponownie.');

            return $this->redirectBack($request);
        }

        /** @var User $user */
        $user = $this->getUser();
        $displayName = trim((string) $request->request->get('display_name', ''));
        $removeAvatar = $request->request->getBoolean('remove_avatar');

        if ($displayName === '' || mb_strlen($displayName) < 3) {
            $this->addFlash('error', 'Nazwa wyświetlana powinna mieć co najmniej 3 znaki.');

            return $this->redirectBack($request);
        }

        $avatarFile = $request->files->get('avatar');
        if ($avatarFile !== null && !$avatarFile instanceof UploadedFile) {
            $this->addFlash('error', 'Nie udało się odczytać przesłanego pliku.');

            return $this->redirectBack($request);
        }

        $user->setDisplayName($displayName);

        if ($removeAvatar) {
            $this->deleteAvatarFile($user->getAvatarPath());
            $user->setAvatarPath(null);
        }

        if ($avatarFile instanceof UploadedFile && $avatarFile->getError() === UPLOAD_ERR_OK) {
            $validationError = $this->validateAvatar($avatarFile);
            if ($validationError !== null) {
                $this->addFlash('error', $validationError);

                return $this->redirectBack($request);
            }

            $avatarPath = $this->storeAvatar($avatarFile);
            if ($avatarPath === null) {
                $this->addFlash('error', 'Nie udało się zapisać zdjęcia profilowego.');

                return $this->redirectBack($request);
            }

            $this->deleteAvatarFile($user->getAvatarPath());
            $user->setAvatarPath($avatarPath);
        }

        $user->touch();
        $entityManager->flush();

        $this->addFlash('success', 'Profil został zaktualizowany.');

        return $this->redirectBack($request);
    }

    private function validateAvatar(UploadedFile $file): ?string
    {
        if ($file->getSize() !== null && $file->getSize() > 2 * 1024 * 1024) {
            return 'Zdjęcie profilowe może mieć maksymalnie 2 MB.';
        }

        $mimeType = (string) $file->getMimeType();
        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($mimeType, $allowedMimeTypes, true)) {
            return 'Dozwolone są pliki JPG, PNG, WEBP lub GIF.';
        }

        return null;
    }

    private function storeAvatar(UploadedFile $file): ?string
    {
        $projectDir = (string) $this->getParameter('kernel.project_dir');
        $targetDirectory = $projectDir.'/public/uploads/avatars';

        if (!is_dir($targetDirectory) && !@mkdir($targetDirectory, 0775, true) && !is_dir($targetDirectory)) {
            return null;
        }

        $extension = $file->guessExtension() ?: 'bin';
        $fileName = sprintf('%s.%s', bin2hex(random_bytes(16)), $extension);

        try {
            $file->move($targetDirectory, $fileName);
        } catch (\Throwable) {
            return null;
        }

        return 'uploads/avatars/'.$fileName;
    }

    private function deleteAvatarFile(?string $avatarPath): void
    {
        if ($avatarPath === null || $avatarPath === '') {
            return;
        }

        $projectDir = (string) $this->getParameter('kernel.project_dir');
        $resolvedPath = $projectDir.'/public/'.ltrim($avatarPath, '/');

        if (is_file($resolvedPath)) {
            @unlink($resolvedPath);
        }
    }

    private function redirectBack(Request $request): RedirectResponse
    {
        $referer = $request->headers->get('referer');

        if (is_string($referer) && $referer !== '') {
            return $this->redirect($referer);
        }

        return $this->redirectToRoute('app_board_index');
    }
}