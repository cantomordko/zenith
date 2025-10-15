import { NextResponse } from 'next/server';
import { Board } from '@/types';
import { initialData } from '@/data/initialData';
import {
  fetchBoardFromSupabase,
  createTicketInSupabase,
  updateTicketPositions,
  addHistoryEntry,
} from '@/lib/supabaseHelpers';

// Tymczasowa "baza danych" w pamięci (fallback gdy Supabase nie jest skonfigurowane)
let boardData: Board = { ...initialData };

// Sprawdź czy Supabase jest skonfigurowane
const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

// GET - Pobierz wszystkie dane
export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const board = await fetchBoardFromSupabase();
      return NextResponse.json(board);
    } else {
      // Fallback do danych w pamięci
      return NextResponse.json(boardData);
    }
  } catch (error) {
    console.error('Błąd pobierania danych:', error);
    return NextResponse.json(boardData);
  }
}

// POST - Utwórz nowy ticket
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, priority, assignee, columnId } = body;

    if (!title || !description || !priority || !columnId) {
      return NextResponse.json(
        { error: 'Brak wymaganych pól' },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      // Użyj Supabase
      const newTicket = await createTicketInSupabase(
        title,
        description,
        priority,
        columnId,
        assignee
      );
      
      // Dodaj wpis do historii
      try {
        await addHistoryEntry(
          newTicket.id,
          assignee || 'System',
          'created',
          `Ticket utworzony z priorytetem: ${priority}`
        );
      } catch (error) {
        console.error('Błąd logowania historii:', error);
      }
      
      return NextResponse.json(newTicket, { status: 201 });
    } else {
      // Fallback do pamięci
      const ticketIds = Object.keys(boardData.tickets);
      const maxId = Math.max(
        ...ticketIds.map((id) => parseInt(id.split('-')[1]))
      );
      const newId = `ticket-${maxId + 1}`;

      const newTicket = {
        id: newId,
        title,
        description,
        priority,
        assignee: assignee || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      boardData.tickets[newId] = newTicket;
      boardData.columns[columnId].ticketIds.push(newId);

      return NextResponse.json(newTicket, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Błąd tworzenia ticketu' },
      { status: 500 }
    );
  }
}

// PUT - Aktualizuj cały board (po drag & drop)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    if (isSupabaseConfigured()) {
      // Pobierz aktualny stan przed aktualizacją
      const oldBoard = await fetchBoardFromSupabase();
      
      // Aktualizuj pozycje w Supabase
      await updateTicketPositions(body);
      
      // Wykryj zmiany kolumn i zaloguj
      try {
        Object.keys(body.tickets).forEach(async (ticketId) => {
          const oldColumnId = Object.keys(oldBoard.columns).find(colId =>
            oldBoard.columns[colId].ticketIds.includes(ticketId)
          );
          const newColumnId = Object.keys(body.columns).find(colId =>
            body.columns[colId].ticketIds.includes(ticketId)
          );
          
          if (oldColumnId && newColumnId && oldColumnId !== newColumnId) {
            const ticket = body.tickets[ticketId];
            await addHistoryEntry(
              ticketId,
              ticket.assignee || 'System',
              'status_changed',
              `Przeniesiono z "${oldBoard.columns[oldColumnId].title}" do "${body.columns[newColumnId].title}"`,
              'column',
              oldBoard.columns[oldColumnId].title,
              body.columns[newColumnId].title
            );
          }
        });
      } catch (error) {
        console.error('Błąd logowania historii:', error);
      }
      
      return NextResponse.json(body);
    } else {
      // Fallback do pamięci
      boardData = body;
      return NextResponse.json(boardData);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Błąd aktualizacji danych' },
      { status: 500 }
    );
  }
}
