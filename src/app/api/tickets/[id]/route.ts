import { NextResponse } from 'next/server';
import { initialData } from '@/data/initialData';
import { updateTicketInSupabase, deleteTicketFromSupabase, addHistoryEntry } from '@/lib/supabaseHelpers';
import { supabase } from '@/lib/supabase';

// Symulacja bazy danych
let boardData = { ...initialData };

// Sprawdź czy Supabase jest skonfigurowane
const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Ticket nie został znaleziony' },
          { status: 404 }
        );
      }

      return NextResponse.json(data);
    } else {
      const ticket = boardData.tickets[id];

      if (!ticket) {
        return NextResponse.json(
          { error: 'Ticket nie został znaleziony' },
          { status: 404 }
        );
      }

      return NextResponse.json(ticket);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Błąd pobierania ticketu' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (isSupabaseConfigured()) {
      // Pobierz stary ticket przed aktualizacją
      const { data: oldTicket } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      const updatedTicket = await updateTicketInSupabase(id, body);
      
      // Loguj zmiany w historii
      try {
        const changes: string[] = [];
        
        if (body.title && oldTicket?.title !== body.title) {
          changes.push(`tytuł`);
          await addHistoryEntry(
            id,
            body.assignee || 'System',
            'updated',
            `Zmieniono tytuł`,
            'title',
            oldTicket?.title,
            body.title
          );
        }
        
        if (body.description && oldTicket?.description !== body.description) {
          changes.push(`opis`);
          await addHistoryEntry(
            id,
            body.assignee || 'System',
            'updated',
            `Zaktualizowano opis`
          );
        }
        
        if (body.priority && oldTicket?.priority !== body.priority) {
          changes.push(`priorytet`);
          await addHistoryEntry(
            id,
            body.assignee || 'System',
            'updated',
            `Zmieniono priorytet`,
            'priority',
            oldTicket?.priority,
            body.priority
          );
        }
        
        if (body.assignee !== undefined && oldTicket?.assignee !== body.assignee) {
          changes.push(`przypisanie`);
          await addHistoryEntry(
            id,
            body.assignee || 'System',
            'updated',
            `Zmieniono osobę przypisaną`,
            'assignee',
            oldTicket?.assignee || 'Brak',
            body.assignee || 'Brak'
          );
        }

        if (changes.length > 0 && changes.length > 1) {
          await addHistoryEntry(
            id,
            body.assignee || 'System',
            'updated',
            `Zaktualizowano: ${changes.join(', ')}`
          );
        }
      } catch (error) {
        console.error('Błąd logowania historii:', error);
      }
      
      return NextResponse.json(updatedTicket);
    } else {
      if (!boardData.tickets[id]) {
        return NextResponse.json(
          { error: 'Ticket nie został znaleziony' },
          { status: 404 }
        );
      }

      // Aktualizuj ticket
      boardData.tickets[id] = {
        ...boardData.tickets[id],
        ...body,
        updatedAt: new Date(),
      };

      return NextResponse.json(boardData.tickets[id]);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Błąd aktualizacji ticketu' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (isSupabaseConfigured()) {
      // Pobierz dane ticketu przed usunięciem
      const { data: ticket } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();
      
      // Loguj usunięcie
      try {
        await addHistoryEntry(
          id,
          'System',
          'deleted',
          `Ticket został usunięty: "${ticket?.title}"`
        );
      } catch (error) {
        console.error('Błąd logowania historii:', error);
      }
      
      await deleteTicketFromSupabase(id);
      return NextResponse.json({ message: 'Ticket usunięty' });
    } else {
      if (!boardData.tickets[id]) {
        return NextResponse.json(
          { error: 'Ticket nie został znaleziony' },
          { status: 404 }
        );
      }

      // Usuń ticket z kolumny
      Object.keys(boardData.columns).forEach((columnId) => {
        boardData.columns[columnId].ticketIds = boardData.columns[
          columnId
        ].ticketIds.filter((ticketId) => ticketId !== id);
      });

      // Usuń ticket
      delete boardData.tickets[id];

      return NextResponse.json({ message: 'Ticket usunięty' });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Błąd usuwania ticketu' },
      { status: 500 }
    );
  }
}
