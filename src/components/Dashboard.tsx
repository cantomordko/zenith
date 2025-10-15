'use client';

import { Ticket, Column } from '@/types';
import { useMemo } from 'react';

interface DashboardProps {
  tickets: Record<string, Ticket>;
  columns: Record<string, Column>;
}

export default function Dashboard({ tickets, columns }: DashboardProps) {
  // Funkcje pomocnicze
  const getColumnColor = (columnId: string) => {
    const colors: Record<string, string> = {
      'column-1': '#8B5CF6', // purple
      'column-2': '#3B82F6', // blue
      'column-3': '#F59E0B', // amber
      'column-4': '#10B981', // green
    };
    return colors[columnId] || '#6B7280';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: '#10B981',
      medium: '#3B82F6',
      high: '#F59E0B',
      critical: '#EF4444',
    };
    return colors[priority];
  };

  // Obliczenia statystyk
  const stats = useMemo(() => {
    const ticketArray = Object.values(tickets);
    const totalTickets = ticketArray.length;

    // Tickety per kolumna
    const ticketsPerColumn = Object.values(columns).map(column => ({
      name: column.title,
      count: column.ticketIds.length,
      color: getColumnColor(column.id),
    }));

    // Tickety per priorytet
    const priorityCounts = {
      low: ticketArray.filter(t => t.priority === 'low').length,
      medium: ticketArray.filter(t => t.priority === 'medium').length,
      high: ticketArray.filter(t => t.priority === 'high').length,
      critical: ticketArray.filter(t => t.priority === 'critical').length,
    };

    // Tickety z assignee vs bez
    const assignedCount = ticketArray.filter(t => t.assignee).length;
    const unassignedCount = totalTickets - assignedCount;

    // Ostatnio dodane tickety
    const recentTickets = ticketArray
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Najpopularniejsze assignees
    const assigneeStats = ticketArray
      .filter(t => t.assignee)
      .reduce((acc, ticket) => {
        const assignee = ticket.assignee!;
        acc[assignee] = (acc[assignee] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topAssignees = Object.entries(assigneeStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalTickets,
      ticketsPerColumn,
      priorityCounts,
      assignedCount,
      unassignedCount,
      recentTickets,
      topAssignees,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, columns]);

  const maxColumnCount = Math.max(...stats.ticketsPerColumn.map(c => c.count));
  const maxPriorityCount = Math.max(...Object.values(stats.priorityCounts));

  return (
    <div className="space-y-4 md:space-y-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          📊 Dashboard & Statystyki
        </h2>
      </div>

      {/* Główne metryki */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Tickets */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs md:text-sm font-semibold opacity-90">Wszystkie tickety</h3>
            <span className="text-2xl md:text-3xl">🎫</span>
          </div>
          <p className="text-3xl md:text-4xl font-black">{stats.totalTickets}</p>
        </div>

        {/* Assigned */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs md:text-sm font-semibold opacity-90">Przypisane</h3>
            <span className="text-2xl md:text-3xl">👤</span>
          </div>
          <p className="text-3xl md:text-4xl font-black">{stats.assignedCount}</p>
          <p className="text-xs opacity-75 mt-1">
            {stats.totalTickets > 0 ? Math.round((stats.assignedCount / stats.totalTickets) * 100) : 0}% wszystkich
          </p>
        </div>

        {/* Unassigned */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs md:text-sm font-semibold opacity-90">Nieprzypisane</h3>
            <span className="text-2xl md:text-3xl">❓</span>
          </div>
          <p className="text-3xl md:text-4xl font-black">{stats.unassignedCount}</p>
          <p className="text-xs opacity-75 mt-1">
            {stats.totalTickets > 0 ? Math.round((stats.unassignedCount / stats.totalTickets) * 100) : 0}% wszystkich
          </p>
        </div>

        {/* Critical Priority */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold opacity-90">Krytyczne</h3>
            <span className="text-3xl">🔥</span>
          </div>
          <p className="text-4xl font-black">{stats.priorityCounts.critical}</p>
          <p className="text-xs opacity-75 mt-1">Wymagają uwagi</p>
        </div>
      </div>

      {/* Wykresy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Tickety per kolumna */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 md:mb-4 flex items-center gap-2">
            📍 Tickety wg statusu
          </h3>
          <div className="space-y-3">
            {stats.ticketsPerColumn.map((column, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {column.name}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {column.count}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${maxColumnCount > 0 ? (column.count / maxColumnCount) * 100 : 0}%`,
                      backgroundColor: column.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tickety per priorytet */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 md:mb-4 flex items-center gap-2">
            ⚡ Tickety wg priorytetu
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.priorityCounts).map(([priority, count]) => (
              <div key={priority}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                    {priority === 'low' && '⬇️ Niski'}
                    {priority === 'medium' && '➡️ Średni'}
                    {priority === 'high' && '⬆️ Wysoki'}
                    {priority === 'critical' && '🔥 Krytyczny'}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {count}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${maxPriorityCount > 0 ? (count / maxPriorityCount) * 100 : 0}%`,
                      backgroundColor: getPriorityColor(priority),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Assignees & Recent Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Assignees */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 md:mb-4 flex items-center gap-2">
            👥 Najbardziej aktywni
          </h3>
          {stats.topAssignees.length > 0 ? (
            <div className="space-y-3">
              {stats.topAssignees.map((assignee, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{assignee.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {assignee.count} {assignee.count === 1 ? 'ticket' : 'ticketów'}
                    </p>
                  </div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {assignee.count}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p className="text-3xl mb-2">👤</p>
              <p>Brak przypisanych ticketów</p>
            </div>
          )}
        </div>

        {/* Recent Tickets */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 md:mb-4 flex items-center gap-2">
            🕒 Ostatnio dodane
          </h3>
          {stats.recentTickets.length > 0 ? (
            <div className="space-y-2">
              {stats.recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                    {ticket.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(ticket.createdAt).toLocaleDateString('pl-PL')}
                    </span>
                    {ticket.assignee && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        {ticket.assignee}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p className="text-3xl mb-2">📋</p>
              <p>Brak ticketów</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
