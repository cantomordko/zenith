'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import toast from 'react-hot-toast';

interface AddTicketFormProps {
  onTicketAdded: () => void;
  columnId: string;
}

export default function AddTicketForm({ onTicketAdded, columnId }: AddTicketFormProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [assignee, setAssignee] = useState('');
  const [assignToMe, setAssignToMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalAssignee = assignToMe && user ? user.email?.split('@')[0] : (assignee || undefined);
      
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority,
          assignee: finalAssignee,
          columnId,
          created_by: user?.id,
        }),
      });

      if (response.ok) {
        toast.success('Ticket dodany!');
        setTitle('');
        setDescription('');
        setPriority('medium');
        setAssignee('');
        setAssignToMe(true);
        setIsOpen(false);
        onTicketAdded();
      } else {
        toast.error('Błąd dodawania ticketu');
      }
    } catch (error) {
      console.error('Błąd tworzenia ticketu:', error);
      toast.error('Błąd dodawania ticketu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold transform hover:scale-[1.02]"
      >
        <span className="text-lg mr-2">+</span>
        Dodaj ticket
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg border-2 border-blue-400 dark:border-blue-500 animate-slideUp">
      <input
        type="text"
        placeholder="📝 Tytuł ticketu"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full px-4 py-3 mb-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all shadow-sm"
      />
      
      <textarea
        placeholder="📄 Opis problemu..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        rows={3}
        className="w-full px-4 py-3 mb-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 resize-none transition-all shadow-sm"
      />

      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as any)}
        className="w-full px-3 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      >
        <option value="low">Niski priorytet</option>
        <option value="medium">Średni priorytet</option>
        <option value="high">Wysoki priorytet</option>
        <option value="critical">Krytyczny</option>
      </select>

      {user && (
        <label className="flex items-center gap-2 mb-3 mt-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={assignToMe}
            onChange={(e) => {
              setAssignToMe(e.target.checked);
              if (e.target.checked) setAssignee('');
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            ✅ Przypisz do mnie ({user.email?.split('@')[0]})
          </span>
        </label>
      )}

      {!assignToMe && (
        <input
          type="text"
          placeholder="Przypisz do... (opcjonalnie)"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="w-full px-3 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors text-sm font-medium"
        >
          {isSubmitting ? 'Dodawanie...' : 'Dodaj'}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm font-medium"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
