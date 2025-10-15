'use client';

import { Droppable } from '@hello-pangea/dnd';
import { Column, Ticket } from '@/types';
import TicketCard from './TicketCard';
import AddTicketForm from './AddTicketForm';

interface KanbanColumnProps {
  column: Column;
  tickets: Ticket[];
  onTicketAdded: () => void;
  onTicketEdit: (ticketId: string, updates: Partial<Ticket>) => void;
  onTicketDelete: (ticketId: string) => void;
}

export default function KanbanColumn({ 
  column, 
  tickets, 
  onTicketAdded,
  onTicketEdit,
  onTicketDelete 
}: KanbanColumnProps) {
  const columnGradients: Record<string, string> = {
    'col-1': 'from-purple-50 to-purple-100 dark:from-gray-800 dark:to-purple-900/20',
    'col-2': 'from-blue-50 to-blue-100 dark:from-gray-800 dark:to-blue-900/20',
    'col-3': 'from-amber-50 to-amber-100 dark:from-gray-800 dark:to-amber-900/20',
    'col-4': 'from-green-50 to-green-100 dark:from-gray-800 dark:to-green-900/20',
  };

  const gradient = columnGradients[column.id] || 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700';

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 md:p-5 min-w-[280px] sm:min-w-[320px] flex flex-col shadow-lg border border-gray-200 dark:border-gray-700`}>
      <div className="flex items-center justify-between mb-3 md:mb-4 pb-2 md:pb-3 border-b-2 border-gray-200 dark:border-gray-600">
        <h2 className="font-bold text-lg md:text-xl text-gray-900 dark:text-white tracking-tight">{column.title}</h2>
        <span className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white text-xs md:text-sm font-bold px-2.5 md:px-3 py-1 md:py-1.5 rounded-full shadow-md min-w-[2rem] md:min-w-[2.5rem] text-center">
          {tickets.length}
        </span>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[200px] rounded-xl p-3 ${
              snapshot.isDraggingOver 
                ? 'bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-blue-400 dark:ring-blue-500' 
                : ''
            }`}
          >
            {/* Empty state podczas drag */}
            {snapshot.isDraggingOver && tickets.length === 0 && (
              <div className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-blue-400 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 animate-pulse">
                <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">📦 Upuść tutaj</p>
              </div>
            )}
            
            {/* Empty state gdy brak ticketów */}
            {!snapshot.isDraggingOver && tickets.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/30 dark:bg-gray-800/30 animate-fadeIn">
                <div className="text-6xl mb-3 opacity-40 animate-float">📭</div>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm text-center px-4">
                  Brak zadań w tej kolumnie
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  Dodaj nowe lub przeciągnij tutaj
                </p>
              </div>
            )}
            
            {tickets.map((ticket, index) => (
              <TicketCard 
                key={`${column.id}-${ticket.id}`}
                ticket={ticket} 
                index={index}
                onEdit={onTicketEdit}
                onDelete={onTicketDelete}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <AddTicketForm columnId={column.id} onTicketAdded={onTicketAdded} />
    </div>
  );
}
