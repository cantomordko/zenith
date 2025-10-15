import { supabase } from './supabase';
import { Board, SupabaseTicket, SupabaseColumn } from '@/types';

// Konwersja danych z Supabase na format Board
export async function fetchBoardFromSupabase(): Promise<Board> {
  // Pobierz kolumny
  const { data: columnsData, error: columnsError } = await supabase
    .from('columns')
    .select('*')
    .order('position');

  if (columnsError) throw columnsError;

  // Pobierz tickety z tagami
  const { data: ticketsData, error: ticketsError } = await supabase
    .from('tickets')
    .select(`
      *,
      ticket_tags(tag_id, tags(*))
    `)
    .order('position');

  if (ticketsError) throw ticketsError;

  // Konwertuj do formatu Board
  const tickets: Record<string, any> = {};
  const columns: Record<string, any> = {};
  const columnOrder: string[] = [];

  // Przetwórz kolumny
  columnsData?.forEach((col: SupabaseColumn) => {
    columns[col.id] = {
      id: col.id,
      title: col.title,
      ticketIds: [],
    };
    columnOrder.push(col.id);
  });

  // Przetwórz tickety
  ticketsData?.forEach((ticket: any) => {
    // Wyciągnij tagi z ticket_tags
    const tags = ticket.ticket_tags?.map((tt: any) => tt.tags).filter(Boolean) || [];
    
    tickets[ticket.id] = {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      assignee: ticket.assignee,
      tags: tags,
      createdAt: new Date(ticket.created_at),
      updatedAt: new Date(ticket.updated_at),
    };

    // Dodaj ticket do odpowiedniej kolumny
    if (columns[ticket.column_id]) {
      columns[ticket.column_id].ticketIds.push(ticket.id);
    }
  });

  return { tickets, columns, columnOrder };
}

// Tworzenie nowego ticketu
export async function createTicketInSupabase(
  title: string,
  description: string,
  priority: 'low' | 'medium' | 'high' | 'critical',
  columnId: string,
  assignee?: string
) {
  // Pobierz aktualną pozycję (ostatni ticket w kolumnie)
  const { data: lastTicket } = await supabase
    .from('tickets')
    .select('position')
    .eq('column_id', columnId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const position = lastTicket ? lastTicket.position + 1 : 0;

  const { data, error } = await supabase
    .from('tickets')
    .insert([
      {
        title,
        description,
        priority,
        column_id: columnId,
        assignee,
        position,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Aktualizacja pozycji ticketów po drag & drop
export async function updateTicketPositions(board: Board) {
  const updates: any[] = [];

  // Przygotuj wszystkie aktualizacje
  Object.values(board.columns).forEach((column) => {
    column.ticketIds.forEach((ticketId, index) => {
      updates.push({
        id: ticketId,
        column_id: column.id,
        position: index,
      });
    });
  });

  // Wykonaj batch update
  for (const update of updates) {
    await supabase
      .from('tickets')
      .update({
        column_id: update.column_id,
        position: update.position,
      })
      .eq('id', update.id);
  }
}

// Aktualizacja ticketu
export async function updateTicketInSupabase(
  id: string,
  updates: Partial<SupabaseTicket>
) {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Usunięcie ticketu
export async function deleteTicketFromSupabase(id: string) {
  const { error } = await supabase.from('tickets').delete().eq('id', id);

  if (error) throw error;
}

// === KOMENTARZE ===

// Pobierz komentarze dla ticketu
export async function getCommentsForTicket(ticketId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data?.map((comment) => ({
    id: comment.id,
    ticketId: comment.ticket_id,
    author: comment.author,
    content: comment.content,
    createdAt: new Date(comment.created_at),
    updatedAt: new Date(comment.updated_at),
  })) || [];
}

// Dodaj komentarz
export async function addCommentToSupabase(
  ticketId: string,
  author: string,
  content: string
) {
  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        ticket_id: ticketId,
        author,
        content,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    ticketId: data.ticket_id,
    author: data.author,
    content: data.content,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// Usuń komentarz
export async function deleteCommentFromSupabase(id: string) {
  const { error } = await supabase.from('comments').delete().eq('id', id);

  if (error) throw error;
}

// Pobierz historię zmian dla ticketu
export async function getHistoryForTicket(ticketId: string) {
  const { data, error } = await supabase
    .from('ticket_history')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data?.map((entry: any) => ({
    id: entry.id,
    ticketId: entry.ticket_id,
    changedBy: entry.changed_by,
    changeType: entry.change_type,
    fieldName: entry.field_name,
    oldValue: entry.old_value,
    newValue: entry.new_value,
    description: entry.description,
    createdAt: new Date(entry.created_at),
  })) || [];
}

// Dodaj wpis do historii
export async function addHistoryEntry(
  ticketId: string,
  changedBy: string,
  changeType: 'created' | 'updated' | 'moved' | 'deleted' | 'status_changed',
  description: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string
) {
  const { error } = await supabase.from('ticket_history').insert([
    {
      ticket_id: ticketId,
      changed_by: changedBy,
      change_type: changeType,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
      description: description,
    },
  ]);

  if (error) throw error;
}
