import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Pobierz tagi ticketu
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ticketId = params.id;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from('ticket_tags')
      .select('tag_id, tags(*)')
      .eq('ticket_id', ticketId);

    if (error) {
      console.error('Error fetching ticket tags:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Wyciągnij same tagi z wyniku
    const tags = data?.map((item: any) => item.tags) || [];
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error in ticket tags GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Dodaj tag do ticketu
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ticketId = params.id;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('ticket_tags')
      .insert([{ ticket_id: ticketId, tag_id: tagId }]);

    if (error) {
      console.error('Error adding tag to ticket:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error in ticket tags POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Usuń tag z ticketu
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ticketId = params.id;
  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get('tagId');

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  if (!tagId) {
    return NextResponse.json(
      { error: 'Tag ID is required' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from('ticket_tags')
      .delete()
      .eq('ticket_id', ticketId)
      .eq('tag_id', tagId);

    if (error) {
      console.error('Error removing tag from ticket:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in ticket tags DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
