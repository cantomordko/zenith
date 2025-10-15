import { NextResponse } from 'next/server';
import {
  getCommentsForTicket,
  addCommentToSupabase,
  deleteCommentFromSupabase,
} from '@/lib/supabaseHelpers';

// Sprawdź czy Supabase jest skonfigurowane
const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

// GET - Pobierz komentarze dla ticketu
export async function GET(
  request: Request,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { ticketId } = params;

    if (!isSupabaseConfigured()) {
      return NextResponse.json([]);
    }

    const comments = await getCommentsForTicket(ticketId);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Błąd pobierania komentarzy:', error);
    return NextResponse.json(
      { error: 'Błąd pobierania komentarzy' },
      { status: 500 }
    );
  }
}

// POST - Dodaj komentarz
export async function POST(
  request: Request,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { ticketId } = params;
    const body = await request.json();
    const { author, content } = body;

    if (!author || !content) {
      return NextResponse.json(
        { error: 'Brak wymaganych pól' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase nie jest skonfigurowane' },
        { status: 503 }
      );
    }

    const comment = await addCommentToSupabase(ticketId, author, content);
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Błąd dodawania komentarza:', error);
    return NextResponse.json(
      { error: 'Błąd dodawania komentarza' },
      { status: 500 }
    );
  }
}
