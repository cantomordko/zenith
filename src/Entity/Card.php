<?php

namespace App\Entity;

use App\Repository\CardRepository;
use DateInterval;
use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CardRepository::class)]
class Card
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'cards')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private BoardColumn $column;

    #[ORM\Column(length: 255)]
    private string $title;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column]
    private int $position = 0;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private DateTimeInterface $createdAt;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private DateTimeInterface $updatedAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?DateTimeInterface $dueAt = null;

    #[ORM\ManyToMany(targetEntity: User::class, inversedBy: 'assignedCards')]
    #[ORM\JoinTable(name: 'card_assignees')]
    private Collection $assignees;

    #[ORM\OneToMany(mappedBy: 'card', targetEntity: CardComment::class, cascade: ['remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['createdAt' => 'ASC'])]
    private Collection $comments;

    #[ORM\OneToMany(mappedBy: 'card', targetEntity: TimeEntry::class, cascade: ['remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['loggedAt' => 'DESC'])]
    private Collection $timeEntries;

    #[ORM\Column(type: Types::JSON)]
    private array $labels = [];

    #[ORM\Column(type: Types::BOOLEAN)]
    private bool $archived = false;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $estimatedMinutes = null;

    public function __construct()
    {
        $now = new DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
        $this->assignees = new ArrayCollection();
        $this->comments = new ArrayCollection();
        $this->timeEntries = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getColumn(): BoardColumn
    {
        return $this->column;
    }

    public function setColumn(BoardColumn $column): self
    {
        $this->column = $column;

        return $this;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): self
    {
        $this->position = $position;

        return $this;
    }

    public function getCreatedAt(): DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function touch(): self
    {
        $this->updatedAt = new DateTimeImmutable();

        return $this;
    }

    public function getDueAt(): ?DateTimeInterface
    {
        return $this->dueAt;
    }

    public function setDueAt(?DateTimeInterface $dueAt): self
    {
        $this->dueAt = $dueAt;

        return $this;
    }

    /**
     * @return Collection<int, User>
     */
    public function getAssignees(): Collection
    {
        return $this->assignees;
    }

    public function addAssignee(User $user): self
    {
        if (!$this->assignees->contains($user)) {
            $this->assignees->add($user);
        }

        return $this;
    }

    public function removeAssignee(User $user): self
    {
        $this->assignees->removeElement($user);

        return $this;
    }

    /**
     * @return Collection<int, CardComment>
     */
    public function getComments(): Collection
    {
        return $this->comments;
    }

    /**
     * @return Collection<int, TimeEntry>
     */
    public function getTimeEntries(): Collection
    {
        return $this->timeEntries;
    }

    public function getLabels(): array
    {
        return $this->labels;
    }

    public function setLabels(array $labels): self
    {
        $this->labels = $labels;

        return $this;
    }

    public function isArchived(): bool
    {
        return $this->archived;
    }

    public function setArchived(bool $archived): self
    {
        $this->archived = $archived;

        return $this;
    }

    public function calculateTotalTrackedMinutes(): int
    {
        $total = 0;
        foreach ($this->timeEntries as $entry) {
            $total += $entry->getMinutesSpent();
        }

        return $total;
    }

    public function getEstimatedMinutes(): ?int
    {
        return $this->estimatedMinutes;
    }

    public function setEstimatedMinutes(?int $minutes): self
    {
        $this->estimatedMinutes = $minutes !== null ? max(0, $minutes) : null;

        return $this;
    }
}
