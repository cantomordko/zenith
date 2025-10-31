<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251030120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add estimated_minutes column to card table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE card ADD estimated_minutes INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE card DROP estimated_minutes');
    }
}
