'use client';

import { useState, useEffect } from 'react';
import { TicketHistoryEntry } from '@/types';
import { supabase } from '@/lib/supabase';

interface TicketHistoryProps {
  ticketId: string;
}

export default function TicketHistory({ ticketId }: TicketHistoryProps) {
  const [history, setHistory] = useState<TicketHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [ticketId]);

  // Realtime subscription dla historii
  useEffect(() => {
    if (isLoading) return;

    const channel = supabase
      .channel(`history-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_history',
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          console.log('📜 History realtime change:', payload.eventType);
          
          // Odśwież historię
          try {
            const response = await fetch(`/api/history/${ticketId}`);
            if (response.ok) {
              const data = await response.json();
              const historyEntries = data.map((entry: any) => ({
                ...entry,
                ticketId: entry.ticket_id,
                changedBy: entry.changed_by,
                changeType: entry.change_type,
                fieldName: entry.field_name,
                oldValue: entry.old_value,
                newValue: entry.new_value,
                createdAt: new Date(entry.created_at),
              }));
              setHistory(historyEntries);
            }
          } catch (error) {
            console.error('Błąd realtime refresh historii:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ History realtime: SUBSCRIBED');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, isLoading]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/history/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        // Konwertuj daty
        const historyEntries = data.map((entry: any) => ({
          ...entry,
          ticketId: entry.ticket_id,
          changedBy: entry.changed_by,
          changeType: entry.change_type,
          fieldName: entry.field_name,
          oldValue: entry.old_value,
          newValue: entry.new_value,
          createdAt: new Date(entry.created_at),
        }));
        setHistory(historyEntries);
      }
    } catch (error) {
      console.error('Błąd ładowania historii:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const historyDate = new Date(date);
    const diffMs = now.getTime() - historyDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Przed chwilą';
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;

    return historyDate.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: historyDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return '✨';
      case 'updated':
        return '✏️';
      case 'moved':
      case 'status_changed':
        return '🔄';
      case 'deleted':
        return '🗑️';
      default:
        return '📝';
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return 'text-green-600 dark:text-green-400';
      case 'updated':
        return 'text-blue-600 dark:text-blue-400';
      case 'moved':
      case 'status_changed':
        return 'text-purple-600 dark:text-purple-400';
      case 'deleted':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Ładowanie historii...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-4xl mb-2">⏱️</div>
        <p>Brak historii zmian</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <div
          key={entry.id}
          className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start gap-3">
            <div className={`text-2xl ${getChangeColor(entry.changeType)}`}>
              {getChangeIcon(entry.changeType)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-1">
                <div className="font-medium text-gray-800 dark:text-gray-200">
                  {entry.changedBy}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(entry.createdAt)}
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                {entry.description}
              </p>
              {entry.fieldName && (entry.oldValue || entry.newValue) && (
                <div className="text-xs bg-gray-50 dark:bg-gray-600 rounded p-2 space-y-1">
                  {entry.oldValue && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Przed: </span>
                      <span className="text-red-600 dark:text-red-400 line-through">
                        {entry.oldValue}
                      </span>
                    </div>
                  )}
                  {entry.newValue && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Po: </span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {entry.newValue}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
