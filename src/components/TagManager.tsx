'use client';

import { useState, useEffect } from 'react';
import { Tag } from '@/types';
import TagBadge from './TagBadge';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface TagManagerProps {
  ticketId: string;
  currentTags: Tag[];
  onTagsChange: () => void;
}

export default function TagManager({ ticketId, currentTags, onTagsChange }: TagManagerProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  useEffect(() => {
    fetchAllTags();
  }, []);

  // Realtime subscription dla tagów
  useEffect(() => {
    if (!tagsLoaded) return;

    const channel = supabase
      .channel('tags-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tags',
        },
        async (payload) => {
          console.log('🏷️ Tags realtime change:', payload.eventType);
          
          // Odśwież listę tagów
          try {
            const response = await fetch('/api/tags');
            if (response.ok) {
              const data = await response.json();
              setAllTags(data);
            }
          } catch (error) {
            console.error('Błąd realtime refresh tagów:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Tags realtime: SUBSCRIBED');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tagsLoaded]);

  // Realtime subscription dla ticket_tags (relacja ticket-tag)
  useEffect(() => {
    if (!tagsLoaded) return;

    const channel = supabase
      .channel(`ticket-tags-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_tags',
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          console.log('🔗 Ticket-tags realtime change:', payload.eventType);
          
          // Powiadom parent component o zmianie tagów
          onTagsChange();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Ticket-tags realtime: SUBSCRIBED');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, tagsLoaded, onTagsChange]);

  const fetchAllTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setAllTags(data);
      }
    } catch (error) {
      console.error('Błąd ładowania tagów:', error);
    } finally {
      setTagsLoaded(true);
    }
  };

  const addTag = async (tagId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });

      if (response.ok) {
        toast.success('Tag dodany!');
        onTagsChange();
        setIsOpen(false);
      } else {
        toast.error('Błąd dodawania tagu');
      }
    } catch (error) {
      console.error('Błąd dodawania tagu:', error);
      toast.error('Błąd dodawania tagu');
    } finally {
      setIsLoading(false);
    }
  };

  const removeTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/tags?tagId=${tagId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Tag usunięty!');
        onTagsChange();
      } else {
        toast.error('Błąd usuwania tagu');
      }
    } catch (error) {
      console.error('Błąd usuwania tagu:', error);
      toast.error('Błąd usuwania tagu');
    }
  };

  const availableTags = allTags.filter(
    tag => !currentTags.some(ct => ct.id === tag.id)
  );

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
        Tagi
      </h3>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {currentTags.length > 0 ? (
          currentTags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onRemove={() => removeTag(tag.id)}
              size="md"
            />
          ))
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500 italic">
            Brak tagów
          </span>
        )}
      </div>

      {!isOpen && availableTags.length > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
        >
          + Dodaj tag
        </button>
      )}

      {isOpen && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex flex-wrap gap-2 mb-2">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => addTag(tag.id)}
                disabled={isLoading}
                className="transition-transform hover:scale-105 disabled:opacity-50"
              >
                <TagBadge tag={tag} size="md" />
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
          >
            Anuluj
          </button>
        </div>
      )}
    </div>
  );
}
