import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Pobierz wszystkie tagi
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in tags GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Utwórz nowy tag
export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: 'Name and color are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('tags')
      .insert([{ name, color }])
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in tags POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
