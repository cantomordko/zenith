<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class RegistrationController extends AbstractController
{
    #[Route('/register', name: 'app_register', methods: ['GET', 'POST'])]
    public function register(
        Request $request,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        UserRepository $userRepository
    ): Response {
        if ($this->getUser()) {
            return $this->redirectToRoute('app_board_index');
        }

        $formData = [
            'email' => trim((string) $request->request->get('email', '')),
            'displayName' => trim((string) $request->request->get('display_name', '')),
        ];
        $errors = [];

        if ($request->isMethod('POST')) {
            if (!$this->isCsrfTokenValid('register', (string) $request->request->get('_csrf_token'))) {
                $errors[] = 'Sesja wygasła. Odśwież stronę i spróbuj ponownie.';
            }

            $email = $formData['email'];
            $displayName = $formData['displayName'];
            $password = (string) $request->request->get('password', '');
            $passwordConfirm = (string) $request->request->get('password_confirm', '');

            if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'Podaj poprawny adres e-mail.';
            }

            if ($displayName === '' || mb_strlen($displayName) < 3) {
                $errors[] = 'Nazwa wyświetlana powinna mieć co najmniej 3 znaki.';
            }

            if (mb_strlen($password) < 8) {
                $errors[] = 'Hasło musi mieć co najmniej 8 znaków.';
            }

            if ($password !== $passwordConfirm) {
                $errors[] = 'Podane hasła muszą być identyczne.';
            }

            if (empty($errors) && $userRepository->findOneByEmail($email) !== null) {
                $errors[] = 'Konto z takim adresem e-mail już istnieje.';
            }

            if (empty($errors)) {
                $user = (new User())
                    ->setEmail($email)
                    ->setDisplayName($displayName);

                $user->setPassword($passwordHasher->hashPassword($user, $password));

                $entityManager->persist($user);
                $entityManager->flush();

                $this->addFlash('success', 'Konto zostało utworzone. Możesz się teraz zalogować.');

                return $this->redirectToRoute('app_login');
            }
        }

        return $this->render('security/register.html.twig', [
            'errors' => $errors,
            'data' => $formData,
        ]);
    }
}
