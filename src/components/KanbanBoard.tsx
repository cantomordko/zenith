'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Board, Ticket } from '@/types';
import KanbanColumn from './KanbanColumn';
import FilterBar from './FilterBar';
import Dashboard from './Dashboard';
import { initialData } from '@/data/initialData';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function KanbanBoard() {
  const [board, setBoard] = useState<Board>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [showDashboard, setShowDashboard] = useState(true);
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null);

  // Załaduj preferencje z localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('kanban-view');
    if (savedView === 'board' || savedView === 'dashboard') {
      setShowDashboard(savedView === 'dashboard');
    }
  }, []);

  // Zapisz preferencje do localStorage
  useEffect(() => {
    localStorage.setItem('kanban-view', showDashboard ? 'dashboard' : 'board');
  }, [showDashboard]);

  // Załaduj dane z API
  useEffect(() => {
    fetchBoard();
  }, []);

  // Realtime subscription - nasłuchuj zmian w bazie
  useEffect(() => {
    // Poczekaj aż dane się załadują przed subskrypcją
    if (isLoading) return;

    const channel = supabase
      .channel('tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tickets',
        },
        async (payload) => {
          console.log('🔄 Realtime change:', payload.eventType, payload);
          
          // Odśwież board po każdej zmianie (bez toastu żeby nie spamować)
          try {
            const response = await fetch('/api/tickets');
            if (response.ok) {
              const data = await response.json();
              setBoard(data);
              
              // Subtelne powiadomienie tylko dla innych użytkowników
              if (payload.eventType === 'INSERT') {
                toast('Ktoś dodał nowy ticket', { icon: '✨', duration: 2000 });
              } else if (payload.eventType === 'DELETE') {
                toast('Ticket został usunięty', { icon: '�️', duration: 2000 });
              }
            }
          } catch (error) {
            console.error('Błąd realtime refresh:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription: SUBSCRIBED');
        } else {
          console.log('⚠️ Realtime subscription:', status);
        }
      });

    // Cleanup - odsubskrybuj przy unmount
    return () => {
      console.log('🔌 Unsubscribing from realtime');
      supabase.removeChannel(channel);
    };
  }, [isLoading]); // Zależność od isLoading

  const fetchBoard = async () => {
    try {
      const response = await fetch('/api/tickets');
      if (response.ok) {
        const data = await response.json();
        setBoard(data);
      }
    } catch (error) {
      console.error('Błąd ładowania danych:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Zapisz zmiany do API z debounce (500ms)
  const updateBoard = useCallback((newBoard: Board) => {
    // Anuluj poprzedni timeout
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    // Ustaw nowy timeout
    const timeout = setTimeout(async () => {
      try {
        await fetch('/api/tickets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBoard),
        });
      } catch (error) {
        console.error('Błąd zapisywania danych:', error);
      }
    }, 500);

    setUpdateTimeout(timeout);
  }, [updateTimeout]);

  // Edytuj ticket
  const handleTicketEdit = async (ticketId: string, updates: Partial<Ticket>) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        toast.success('Ticket zaktualizowany!');
        await fetchBoard(); // Odśwież board
      } else {
        toast.error('Błąd aktualizacji ticketu');
      }
    } catch (error) {
      console.error('Błąd edycji ticketu:', error);
      toast.error('Błąd aktualizacji ticketu');
    }
  };

  // Usuń ticket
  const handleTicketDelete = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Ticket usunięty!');
        await fetchBoard(); // Odśwież board
      } else {
        toast.error('Błąd usuwania ticketu');
      }
    } catch (error) {
      console.error('Błąd usuwania ticketu:', error);
      toast.error('Błąd usuwania ticketu');
    }
  };

  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Jeśli nie ma miejsca docelowego, wyjdź
    if (!destination) {
      return;
    }

    // Jeśli miejsce docelowe jest takie samo jak źródło
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const startColumn = board.columns[source.droppableId];
    const finishColumn = board.columns[destination.droppableId];

    // Przesuwanie w obrębie tej samej kolumny
    if (startColumn === finishColumn) {
      // Usuń duplikaty i zachowaj oryginalną kolejność
      const uniqueIds = [...new Set(startColumn.ticketIds)];
      
      // Znajdź rzeczywisty indeks draggableId w oryginalnej tablicy
      const oldIndex = uniqueIds.indexOf(draggableId);
      if (oldIndex === -1) return; // Ticket nie istnieje w kolumnie
      
      // Usuń z starej pozycji
      uniqueIds.splice(oldIndex, 1);
      
      // Wstaw na nowej pozycji
      // Jeśli mamy filtry aktywne, zawsze wstawiaj na koniec
      const hasActiveFilters = searchTerm || priorityFilter !== 'all' || assigneeFilter || tagFilter !== 'all' || dateFrom || dateTo;
      const newIndex = hasActiveFilters ? uniqueIds.length : destination.index;
      uniqueIds.splice(newIndex, 0, draggableId);

      const newColumn = {
        ...startColumn,
        ticketIds: uniqueIds,
      };

      const newBoard = {
        ...board,
        columns: {
          ...board.columns,
          [newColumn.id]: newColumn,
        },
      };

      setBoard(newBoard);
      updateBoard(newBoard);
      return;
    }

    // Przesuwanie między kolumnami
    // Usuń duplikaty w obu kolumnach
    const startUniqueIds = [...new Set(startColumn.ticketIds)];
    const finishUniqueIds = [...new Set(finishColumn.ticketIds)];
    
    // Usuń ticket z kolumny źródłowej
    const newStartTicketIds = startUniqueIds.filter(id => id !== draggableId);
    
    // Usuń ticket z kolumny docelowej jeśli już tam jest
    const newFinishTicketIds = finishUniqueIds.filter(id => id !== draggableId);
    
    // Dodaj na końcu gdy mamy aktywne filtry, w przeciwnym razie na wskazanej pozycji
    const hasActiveFilters = searchTerm || priorityFilter !== 'all' || assigneeFilter || tagFilter !== 'all' || dateFrom || dateTo;
    if (hasActiveFilters) {
      newFinishTicketIds.push(draggableId);
    } else {
      newFinishTicketIds.splice(destination.index, 0, draggableId);
    }

    const newStartColumn = {
      ...startColumn,
      ticketIds: newStartTicketIds,
    };

    const newFinishColumn = {
      ...finishColumn,
      ticketIds: newFinishTicketIds,
    };

    const newBoard = {
      ...board,
      columns: {
        ...board.columns,
        [newStartColumn.id]: newStartColumn,
        [newFinishColumn.id]: newFinishColumn,
      },
    };

    setBoard(newBoard);
    updateBoard(newBoard);

    // Subtelny toast notification
    const ticket = board.tickets[draggableId];
    toast.success(`Przeniesiono do "${finishColumn.title}"`, {
      duration: 1500,
    });
  }, [board, searchTerm, priorityFilter, assigneeFilter, tagFilter, dateFrom, dateTo, updateBoard]);

  // Filtrowanie ticketów
  const filterAndSortTickets = (tickets: Ticket[]): Ticket[] => {
    // Filtrowanie
    let filtered = tickets.filter((ticket) => {
      // Filtruj po wyszukiwaniu
      const matchesSearch =
        searchTerm === '' ||
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtruj po priorytecie
      const matchesPriority =
        priorityFilter === 'all' || ticket.priority === priorityFilter;

      // Filtruj po assignee
      const matchesAssignee =
        assigneeFilter === '' ||
        (ticket.assignee &&
          ticket.assignee.toLowerCase().includes(assigneeFilter.toLowerCase()));

      // Filtruj po tagu
      const matchesTag =
        tagFilter === 'all' ||
        (ticket.tags && ticket.tags.some(tag => tag.id === tagFilter));

      // Filtruj po dacie od
      const matchesDateFrom =
        dateFrom === '' ||
        new Date(ticket.createdAt) >= new Date(dateFrom);

      // Filtruj po dacie do
      const matchesDateTo =
        dateTo === '' ||
        new Date(ticket.createdAt) <= new Date(dateTo + 'T23:59:59');

      return matchesSearch && matchesPriority && matchesAssignee && matchesTag && matchesDateFrom && matchesDateTo;
    });

    // Sortowanie
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'createdAt-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'priority-desc':
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'priority-asc':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'updatedAt-desc':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        {/* Skeleton dla przycisków Dashboard/Board */}
        <div className="flex gap-3 mb-6 animate-pulse">
          <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
        
        {/* Skeleton dla FilterBar */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 mb-6 animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
          <div className="flex gap-4">
            <div className="h-12 flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-12 w-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-12 w-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
        
        {/* Skeleton dla kolumn Kanban */}
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[320px] bg-gray-100 dark:bg-gray-800 rounded-xl p-5 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-7 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 md:px-6">
      {/* Toggle Dashboard/Board */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => setShowDashboard(true)}
          className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all shadow-md text-sm sm:text-base ${
            showDashboard
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-lg'
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setShowDashboard(false)}
          className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all shadow-md text-sm sm:text-base ${
            !showDashboard
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-lg'
          }`}
        >
          📋 Kanban Board
        </button>
      </div>

      {showDashboard ? (
        <Dashboard tickets={board.tickets} columns={board.columns} />
      ) : (
        <>
          {/* Oblicz wszystkie przefiltrowane tickety dla licznika */}
          {(() => {
            const allTickets = Object.values(board.tickets);
            const filteredCount = filterAndSortTickets(allTickets).length;
            
            return (
              <FilterBar
                onSearchChange={setSearchTerm}
                onPriorityFilter={setPriorityFilter}
                onAssigneeFilter={setAssigneeFilter}
                onTagFilter={setTagFilter}
                onSortChange={setSortBy}
                onDateFromFilter={setDateFrom}
                onDateToFilter={setDateTo}
                resultsCount={filteredCount}
              />
            );
          })()}

          {/* Info banner gdy są aktywne filtry */}
          {(searchTerm || priorityFilter !== 'all' || assigneeFilter || tagFilter !== 'all' || dateFrom || dateTo) && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg animate-slideDown">
              <div className="flex items-center gap-2">
                <span className="text-amber-600 dark:text-amber-400 text-lg">⚠️</span>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>Filtry aktywne:</strong> Przeciąganie ticketów z aktywnymi filtrami umieści je na końcu kolumny docelowej.
                </p>
              </div>
            </div>
          )}

          <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 md:gap-4 overflow-x-auto p-2 sm:p-4 md:p-6 pb-6">
          {board.columnOrder.map((columnId) => {
            const column = board.columns[columnId];
            // Deduplikacja ticketIds - usuń duplikaty
            const uniqueTicketIds = [...new Set(column.ticketIds)];
            const allTickets = uniqueTicketIds
              .map((ticketId) => board.tickets[ticketId])
              .filter(Boolean); // Usuń undefined/null jeśli ticket nie istnieje
            const filteredTickets = filterAndSortTickets(allTickets);

            return (
              <KanbanColumn
                key={column.id}
                column={column}
                tickets={filteredTickets}
                onTicketAdded={fetchBoard}
                onTicketEdit={handleTicketEdit}
                onTicketDelete={handleTicketDelete}
              />
            );
          })}
        </div>
      </DragDropContext>
        </>
      )}
    </div>
  );
}
