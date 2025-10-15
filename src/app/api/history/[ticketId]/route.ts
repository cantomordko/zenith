import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Pobierz historię zmian dla ticketu
export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  const ticketId = params.ticketId;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from('ticket_history')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in history GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Dodaj wpis do historii
export async function POST(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  const ticketId = params.ticketId;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { changedBy, changeType, fieldName, oldValue, newValue, description } = body;

    const { data, error } = await supabase
      .from('ticket_history')
      .insert([
        {
          ticket_id: ticketId,
          changed_by: changedBy,
          change_type: changeType,
          field_name: fieldName,
          old_value: oldValue,
          new_value: newValue,
          description: description,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating history entry:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in history POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
