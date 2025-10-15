import { Board } from '@/types';

export const initialData: Board = {
  tickets: {
    'ticket-1': {
      id: 'ticket-1',
      title: 'Problem z logowaniem',
      description: 'Użytkownik nie może się zalogować do systemu',
      priority: 'high',
      assignee: 'Jan Kowalski',
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-01'),
    },
    'ticket-2': {
      id: 'ticket-2',
      title: 'Aktualizacja oprogramowania',
      description: 'Wymagana aktualizacja do najnowszej wersji',
      priority: 'medium',
      assignee: 'Anna Nowak',
      createdAt: new Date('2025-10-02'),
      updatedAt: new Date('2025-10-02'),
    },
    'ticket-3': {
      id: 'ticket-3',
      title: 'Błąd w raporcie',
      description: 'Raport wyświetla nieprawidłowe dane',
      priority: 'low',
      createdAt: new Date('2025-10-03'),
      updatedAt: new Date('2025-10-03'),
    },
    'ticket-4': {
      id: 'ticket-4',
      title: 'Serwer nie odpowiada',
      description: 'Serwer produkcyjny nie odpowiada na zapytania',
      priority: 'critical',
      assignee: 'Piotr Wiśniewski',
      createdAt: new Date('2025-10-04'),
      updatedAt: new Date('2025-10-04'),
    },
  },
  columns: {
    'column-1': {
      id: 'column-1',
      title: 'Do zrobienia',
      ticketIds: ['ticket-1', 'ticket-2'],
    },
    'column-2': {
      id: 'column-2',
      title: 'W trakcie',
      ticketIds: ['ticket-4'],
    },
    'column-3': {
      id: 'column-3',
      title: 'Do weryfikacji',
      ticketIds: [],
    },
    'column-4': {
      id: 'column-4',
      title: 'Zakończone',
      ticketIds: ['ticket-3'],
    },
  },
  columnOrder: ['column-1', 'column-2', 'column-3', 'column-4'],
};
