import { NextResponse } from 'next/server';
import { deleteCommentFromSupabase } from '@/lib/supabaseHelpers';

// Sprawdź czy Supabase jest skonfigurowane
const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

// DELETE - Usuń komentarz
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase nie jest skonfigurowane' },
        { status: 503 }
      );
    }

    await deleteCommentFromSupabase(id);
    return NextResponse.json({ message: 'Komentarz usunięty' });
  } catch (error) {
    console.error('Błąd usuwania komentarza:', error);
    return NextResponse.json(
      { error: 'Błąd usuwania komentarza' },
      { status: 500 }
    );
  }
}
