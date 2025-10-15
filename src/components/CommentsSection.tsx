'use client';

import { useState, useEffect } from 'react';
import { Comment } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface CommentsSectionProps {
  ticketId: string;
}

export default function CommentsSection({ ticketId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [ticketId]);

  // Realtime subscription dla komentarzy
  useEffect(() => {
    if (isLoading) return; // Poczekaj na załadowanie

    const channel = supabase
      .channel(`comments-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          console.log('💬 Comment realtime change:', payload.eventType);
          
          // Odśwież komentarze natychmiast
          try {
            const response = await fetch(`/api/comments/${ticketId}`);
            if (response.ok) {
              const data = await response.json();
              setComments(data);
              
              if (payload.eventType === 'INSERT') {
                toast('Nowy komentarz!', { icon: '💬', duration: 2000 });
              }
            }
          } catch (error) {
            console.error('Błąd realtime refresh komentarzy:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Comments realtime: SUBSCRIBED');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, isLoading]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Błąd ładowania komentarzy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!author.trim() || !newComment.trim()) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/comments/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: author.trim(),
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Komentarz dodany!');
        setNewComment('');
        await fetchComments();
      } else {
        toast.error('Błąd dodawania komentarza');
      }
    } catch (error) {
      console.error('Błąd dodawania komentarza:', error);
      toast.error('Błąd dodawania komentarza');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten komentarz?')) return;

    try {
      const response = await fetch(`/api/comments/delete/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Komentarz usunięty!');
        await fetchComments();
      } else {
        toast.error('Błąd usuwania komentarza');
      }
    } catch (error) {
      console.error('Błąd usuwania komentarza:', error);
      toast.error('Błąd usuwania komentarza');
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Przed chwilą';
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;

    return commentDate.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: commentDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Ładowanie komentarzy...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Lista komentarzy */}
      {comments.length > 0 ? (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-5 hover:shadow-lg transition-all hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                    {comment.author.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 dark:text-gray-200">{comment.author}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      ⏰ {formatDate(comment.createdAt)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all hover:scale-125 text-2xl"
                  title="Usuń komentarz"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap ml-13">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400 dark:text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl mb-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-5xl mb-3">💬</div>
          <p className="font-semibold">Brak komentarzy. Dodaj pierwszy!</p>
        </div>
      )}

      {/* Formularz dodawania komentarza */}
      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border-2 border-blue-200 dark:border-gray-600 shadow-lg">
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          ✍️ Dodaj nowy komentarz
        </h4>
        <div className="mb-4">
          <input
            type="text"
            placeholder="👤 Twoje imię..."
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all shadow-sm hover:shadow-md"
            required
          />
        </div>
        <div className="mb-4">
          <textarea
            placeholder="💬 Napisz komentarz..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none transition-all shadow-sm hover:shadow-md"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 dark:disabled:from-gray-600 dark:disabled:to-gray-700 transition-all font-bold shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
        >
          {isSubmitting ? '⏳ Dodawanie...' : '✅ Dodaj komentarz'}
        </button>
      </form>
    </div>
  );
}
