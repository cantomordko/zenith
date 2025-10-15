'use client';

import { useState } from 'react';
import { Ticket } from '@/types';

interface EditTicketModalProps {
  ticket: Ticket;
  onClose: () => void;
  onSave: (updatedTicket: Partial<Ticket>) => void;
}

export default function EditTicketModal({ ticket, onClose, onSave }: EditTicketModalProps) {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description);
  const [priority, setPriority] = useState(ticket.priority);
  const [assignee, setAssignee] = useState(ticket.assignee || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave({
        title,
        description,
        priority,
        assignee: assignee || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Błąd aktualizacji ticketu:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp border border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>✏️</span> Edytuj ticket
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-3xl leading-none transition-all hover:scale-110"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📝 Tytuł
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all shadow-sm hover:shadow-md"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📄 Opis
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none transition-all shadow-sm hover:shadow-md"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              ⚡ Priorytet
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <option value="low">Niski priorytet</option>
              <option value="medium">Średni priorytet</option>
              <option value="high">Wysoki priorytet</option>
              <option value="critical">Krytyczny</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              👤 Przypisz do
            </label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Opcjonalnie"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all shadow-sm hover:shadow-md"
            />
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-all font-semibold shadow-sm hover:shadow-md hover:scale-105"
            >
              ❌ Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 dark:disabled:from-gray-600 dark:disabled:to-gray-700 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
            >
              {isSubmitting ? '💾 Zapisywanie...' : '✅ Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
