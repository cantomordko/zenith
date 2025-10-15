'use client';

import { Ticket } from '@/types';
import { useState } from 'react';
import EditTicketModal from './EditTicketModal';
import CommentsSection from './CommentsSection';
import TicketHistory from './TicketHistory';
import TagManager from './TagManager';

interface TicketDetailsModalProps {
  ticket: Ticket;
  onClose: () => void;
  onEdit: (ticketId: string, updates: Partial<Ticket>) => void;
  onDelete: (ticketId: string) => void;
}

const priorityColors = {
  low: 'bg-green-100 border-green-500 text-green-800',
  medium: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  high: 'bg-orange-100 border-orange-500 text-orange-800',
  critical: 'bg-red-100 border-red-500 text-red-800',
};

const priorityLabels = {
  low: 'Niski priorytet',
  medium: 'Średni priorytet',
  high: 'Wysoki priorytet',
  critical: 'Krytyczny',
};

const priorityIcons = {
  low: '⬇️',
  medium: '➡️',
  high: '⬆️',
  critical: '🔥',
};

export default function TicketDetailsModal({
  ticket,
  onClose,
  onEdit,
  onDelete,
}: TicketDetailsModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDelete = () => {
    if (confirm('Czy na pewno chcesz usunąć ten ticket?')) {
      onDelete(ticket.id);
      onClose();
    }
  };

  const handleTagsChange = () => {
    // Wymuszenie przeładowania boardu w komponencie nadrzędnym
    setRefreshKey(prev => prev + 1);
    // Możemy tutaj wywołać callback do parent, który odświeży cały board
    window.location.reload(); // Tymczasowe rozwiązanie
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isEditMode) {
    return (
      <EditTicketModal
        ticket={ticket}
        onClose={() => setIsEditMode(false)}
        onSave={(updates) => {
          onEdit(ticket.id, updates);
          setIsEditMode(false);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slideUp transition-colors border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 px-6 py-5 transition-colors rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-white/90 font-mono bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                  #{ticket.id}
                </span>
                <span
                  className={`inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full border-2 font-semibold bg-white/90 backdrop-blur-sm ${
                    priorityColors[ticket.priority]
                  }`}
                >
                  {priorityIcons[ticket.priority]}
                  {priorityLabels[ticket.priority]}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">{ticket.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-3xl leading-none ml-4 transition-all hover:scale-110"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Opis */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide flex items-center gap-2">
              📄 Opis
            </h3>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 text-gray-700 dark:text-gray-200 whitespace-pre-wrap shadow-sm border border-gray-200 dark:border-gray-600">
              {ticket.description}
            </div>
          </div>

          {/* Metadane */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Przypisana osoba */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 shadow-sm border border-blue-100 dark:border-gray-600">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                👤 Przypisana osoba
              </h3>
              {ticket.assignee ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg">
                    {ticket.assignee.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">{ticket.assignee}</span>
                </div>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 italic">Nie przypisano</span>
              )}
            </div>

            {/* Daty */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 shadow-sm border border-amber-100 dark:border-gray-600">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                📅 Daty
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">⏰ Utworzono:</span>
                  <div className="text-gray-800 dark:text-gray-200 font-semibold">{formatDate(ticket.createdAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">🔄 Zaktualizowano:</span>
                  <div className="text-gray-800 dark:text-gray-200 font-semibold">{formatDate(ticket.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sekcja tagów */}
          <div className="mb-6">
            <TagManager 
              ticketId={ticket.id} 
              currentTags={ticket.tags || []} 
              onTagsChange={handleTagsChange}
            />
          </div>

          {/* Sekcja komentarzy */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide flex items-center gap-2">
              💬 Komentarze
            </h3>
            <CommentsSection ticketId={ticket.id} />
          </div>

          {/* Historia zmian */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide flex items-center gap-2">
              📜 Historia zmian
            </h3>
            <TicketHistory ticketId={ticket.id} />
          </div>
        </div>

        {/* Footer z akcjami */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t-2 border-gray-200 dark:border-gray-700 px-6 py-5 flex gap-4 justify-end rounded-b-2xl">
          <button
            onClick={handleDelete}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white rounded-lg hover:from-red-600 hover:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
          >
            🗑️ Usuń ticket
          </button>
          <button
            onClick={() => setIsEditMode(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
          >
            ✏️ Edytuj
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-all font-semibold shadow-sm hover:shadow-md hover:scale-105"
          >
            ❌ Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
