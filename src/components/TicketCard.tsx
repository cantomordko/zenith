'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Ticket } from '@/types';
import { useState } from 'react';
import TicketDetailsModal from './TicketDetailsModal';
import TagBadge from './TagBadge';

interface TicketCardProps {
  ticket: Ticket;
  index: number;
  onEdit: (ticketId: string, updates: Partial<Ticket>) => void;
  onDelete: (ticketId: string) => void;
}

const priorityColors = {
  low: 'bg-green-100 border-green-300 text-green-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  high: 'bg-orange-100 border-orange-300 text-orange-800',
  critical: 'bg-red-100 border-red-300 text-red-800',
};

const priorityLabels = {
  low: 'Niski',
  medium: 'Średni',
  high: 'Wysoki',
  critical: 'Krytyczny',
};

export default function TicketCard({ ticket, index, onEdit, onDelete }: TicketCardProps) {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const handleDelete = () => {
    if (confirm(`🗑️ Czy na pewno chcesz usunąć ticket:\n\n"${ticket.title}"\n\nTej operacji nie można cofnąć!`)) {
      onDelete(ticket.id);
    }
  };

  return (
    <>
      <Draggable draggableId={ticket.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            className={`bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 relative group cursor-grab active:cursor-grabbing
              ${snapshot.isDragging 
                ? 'shadow-2xl scale-105 border-2 border-blue-500 dark:border-blue-400 opacity-90' 
                : 'shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-shadow'
              }`}
          >
            {/* Przyciski akcji */}
            <div className={`absolute top-2 right-2 flex gap-2 transition-all duration-200 ${
              showActions && !snapshot.isDragging ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
            }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDetailsModalOpen(true);
                }}
                className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-110 flex items-center justify-center"
                title="Zobacz szczegóły"
              >
                <span className="text-sm">👁</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl hover:scale-110 flex items-center justify-center"
                title="Usuń"
              >
                <span className="text-lg font-bold">×</span>
              </button>
            </div>

            <div 
              className="cursor-pointer"
              onClick={() => setIsDetailsModalOpen(true)}
            >
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 pr-20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-base leading-snug">
                {ticket.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                {ticket.description}
              </p>
              
              {/* Tagi - max 3 widoczne */}
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {ticket.tags.slice(0, 3).map((tag) => (
                    <TagBadge key={tag.id} tag={tag} size="sm" />
                  ))}
                  {ticket.tags.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full font-semibold">
                      +{ticket.tags.length - 3} więcej
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span
                className={`text-xs px-2 py-1 rounded-full border ${
                  priorityColors[ticket.priority]
                }`}
              >
                {priorityLabels[ticket.priority]}
              </span>
              
              {ticket.assignee && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                    {ticket.assignee.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>

      {isDetailsModalOpen && (
        <TicketDetailsModal
          ticket={ticket}
          onClose={() => setIsDetailsModalOpen(false)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
