'use client';

import { useState, useEffect } from 'react';
import { Tag } from '@/types';

interface FilterBarProps {
  onSearchChange: (search: string) => void;
  onPriorityFilter: (priority: string) => void;
  onAssigneeFilter: (assignee: string) => void;
  onTagFilter: (tagId: string) => void;
  onSortChange: (sort: string) => void;
  onDateFromFilter: (date: string) => void;
  onDateToFilter: (date: string) => void;
  resultsCount?: number;
}

export default function FilterBar({ 
  onSearchChange, 
  onPriorityFilter, 
  onAssigneeFilter,
  onTagFilter,
  onSortChange,
  onDateFromFilter,
  onDateToFilter,
  resultsCount = 0
}: FilterBarProps) {
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [assignee, setAssignee] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K - focus na search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Szukaj"]') as HTMLInputElement;
        searchInput?.focus();
      }
      // Escape - wyczyść search jeśli ma focus
      if (e.key === 'Escape') {
        const searchInput = document.querySelector('input[placeholder*="Szukaj"]') as HTMLInputElement;
        if (document.activeElement === searchInput && search) {
          setSearch('');
          onSearchChange('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [search, onSearchChange]);

  // Debounce search - opóźnienie 300ms
  useEffect(() => {
    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      onSearchChange(search);
      setIsSearching(false);
    }, 300);
    return () => {
      clearTimeout(timeoutId);
      setIsSearching(false);
    };
  }, [search, onSearchChange]);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data);
      }
    } catch (error) {
      console.error('Błąd ładowania tagów:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    // onSearchChange jest teraz w useEffect z debounce
  };

  const handlePriorityChange = (value: string) => {
    setPriority(value);
    onPriorityFilter(value);
  };

  const handleAssigneeChange = (value: string) => {
    setAssignee(value);
    onAssigneeFilter(value);
  };

  const handleTagChange = (value: string) => {
    setSelectedTag(value);
    onTagFilter(value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onSortChange(value);
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    onDateFromFilter(value);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    onDateToFilter(value);
  };

  const handleReset = () => {
    setSearch('');
    setPriority('all');
    setAssignee('');
    setSelectedTag('all');
    setSortBy('createdAt-desc');
    setDateFrom('');
    setDateTo('');
    onSearchChange('');
    onPriorityFilter('all');
    onAssigneeFilter('');
    onTagFilter('all');
    onSortChange('createdAt-desc');
    onDateFromFilter('');
    onDateToFilter('');
  };

  const activeFiltersCount = [
    search,
    priority !== 'all',
    assignee,
    selectedTag !== 'all',
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  return (
    <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-4 md:p-6 mb-6 transition-all border border-gray-200 dark:border-gray-700">
      {/* Nagłówek z przyciskiem zaawansowanych */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="text-lg md:text-xl">🔍</span>
            <span className="hidden sm:inline">Filtrowanie i wyszukiwanie</span>
            <span className="sm:hidden">Filtry</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                {activeFiltersCount}
              </span>
            )}
          </h3>
          {/* Licznik wyników */}
          <div 
            key={resultsCount}
            className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-green-200 dark:border-green-800 animate-scaleIn"
            title={`Znaleziono ${resultsCount} ${resultsCount === 1 ? 'wynik' : resultsCount > 1 && resultsCount < 5 ? 'wyniki' : 'wyników'}`}
          >
            <span className="text-base md:text-lg">📊</span>
            <div className="text-xs md:text-sm">
              <span className="font-bold text-green-700 dark:text-green-400 text-base md:text-lg transition-all">{resultsCount}</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">
                {resultsCount === 1 ? 'wynik' : resultsCount > 1 && resultsCount < 5 ? 'wyniki' : 'wyników'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
        >
          {showAdvanced ? '📊 Ukryj zaawansowane' : '⚙️ Pokaż zaawansowane'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Active Filters Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 animate-slideDown">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 self-center">Aktywne filtry:</span>
            
            {search && (
              <div className="flex items-center gap-1 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full text-sm border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all animate-fadeIn">
                <span className="text-gray-700 dark:text-gray-300 font-medium">🔍 "{search}"</span>
                <button
                  onClick={() => {
                    setSearch('');
                    onSearchChange('');
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full w-5 h-5 flex items-center justify-center font-bold transition-all"
                  title="Usuń filtr"
                >
                  ×
                </button>
              </div>
            )}
            
            {priority !== 'all' && (
              <div className="flex items-center gap-1 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full text-sm border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all animate-fadeIn">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  ⚡ {priority === 'low' ? 'Niski' : priority === 'medium' ? 'Średni' : priority === 'high' ? 'Wysoki' : 'Krytyczny'}
                </span>
                <button
                  onClick={() => {
                    setPriority('all');
                    onPriorityFilter('all');
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full w-5 h-5 flex items-center justify-center font-bold transition-all"
                  title="Usuń filtr"
                >
                  ×
                </button>
              </div>
            )}
            
            {assignee && (
              <div className="flex items-center gap-1 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full text-sm border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all animate-fadeIn">
                <span className="text-gray-700 dark:text-gray-300 font-medium">👤 {assignee}</span>
                <button
                  onClick={() => {
                    setAssignee('');
                    onAssigneeFilter('');
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full w-5 h-5 flex items-center justify-center font-bold transition-all"
                  title="Usuń filtr"
                >
                  ×
                </button>
              </div>
            )}
            
            {selectedTag !== 'all' && (
              <div className="flex items-center gap-1 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full text-sm border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all animate-fadeIn">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  🏷️ {availableTags.find(t => t.id === selectedTag)?.name || 'Tag'}
                </span>
                <button
                  onClick={() => {
                    setSelectedTag('all');
                    onTagFilter('all');
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full w-5 h-5 flex items-center justify-center font-bold transition-all"
                  title="Usuń filtr"
                >
                  ×
                </button>
              </div>
            )}
            
            {dateFrom && (
              <div className="flex items-center gap-1 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full text-sm border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all animate-fadeIn">
                <span className="text-gray-700 dark:text-gray-300 font-medium">📅 Od: {new Date(dateFrom).toLocaleDateString('pl-PL')}</span>
                <button
                  onClick={() => {
                    setDateFrom('');
                    onDateFromFilter('');
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full w-5 h-5 flex items-center justify-center font-bold transition-all"
                  title="Usuń filtr"
                >
                  ×
                </button>
              </div>
            )}
            
            {dateTo && (
              <div className="flex items-center gap-1 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full text-sm border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all animate-fadeIn">
                <span className="text-gray-700 dark:text-gray-300 font-medium">📅 Do: {new Date(dateTo).toLocaleDateString('pl-PL')}</span>
                <button
                  onClick={() => {
                    setDateTo('');
                    onDateToFilter('');
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full w-5 h-5 flex items-center justify-center font-bold transition-all"
                  title="Usuń filtr"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        {/* Podstawowe filtry */}
        <div className="flex flex-wrap gap-3 md:gap-4 items-center">
        {/* Wyszukiwarka */}
        <div className="w-full md:flex-1 md:min-w-[240px] stagger-item">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
            <input
              type="text"
              placeholder="Szukaj w tytule lub opisie... (Ctrl+K)"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-10 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
              title="Skrót: Ctrl+K aby skupić, Escape aby wyczyścić"
            />
            {/* Wskaźnik wyszukiwania lub przycisk clear */}
            {isSearching && search ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : search ? (
              <button
                onClick={() => {
                  setSearch('');
                  onSearchChange('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors font-bold text-xl hover:scale-110"
                title="Wyczyść wyszukiwanie"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>

        {/* Filtr priorytetu */}
        <div className="w-full sm:w-auto sm:min-w-[180px] stagger-item">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">⚡</span>
            <select
              value={priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md appearance-none bg-white dark:bg-gray-700 cursor-pointer"
            >
              <option value="all">Priorytet</option>
              <option value="low">⬇️ Niski</option>
              <option value="medium">➡️ Średni</option>
              <option value="high">⬆️ Wysoki</option>
              <option value="critical">🔥 Krytyczny</option>
            </select>
          </div>
        </div>

        {/* Filtr assignee */}
        <div className="w-full sm:w-auto sm:min-w-[180px] stagger-item">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">👤</span>
            <input
              type="text"
              placeholder="Osoba..."
              value={assignee}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
            />
          </div>
        </div>

        {/* Filtr tagów */}
        <div className="w-full sm:w-auto sm:min-w-[180px]">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🏷️</span>
            <select
              value={selectedTag}
              onChange={(e) => handleTagChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md appearance-none bg-white dark:bg-gray-700"
            >
              <option value="all">Tagi</option>
              {availableTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Przycisk reset */}
        {activeFiltersCount > 0 && (
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-semibold shadow-md hover:shadow-lg flex items-center gap-2 hover:scale-105 animate-slideInRight"
            title="Usuń wszystkie filtry"
          >
            <span className="text-lg">�️</span>
            Wyczyść wszystko ({activeFiltersCount})
          </button>
        )}
        </div>

        {/* Zaawansowane filtry */}
        {showAdvanced && (
          <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700 animate-slideDown">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              ⚙️ Zaawansowane opcje
            </h4>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4">
              {/* Sortowanie */}
              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  📊 Sortuj według
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md appearance-none bg-white dark:bg-gray-700 cursor-pointer text-sm"
                >
                  <option value="createdAt-desc">🆕 Najnowsze</option>
                  <option value="createdAt-asc">🕐 Najstarsze</option>
                  <option value="title-asc">🔤 Tytuł (A-Z)</option>
                  <option value="title-desc">🔤 Tytuł (Z-A)</option>
                  <option value="priority-desc">⚡ Priorytet (wysoki-niski)</option>
                  <option value="priority-asc">⚡ Priorytet (niski-wysoki)</option>
                  <option value="updatedAt-desc">🔄 Ostatnio zaktualizowane</option>
                </select>
              </div>

              {/* Data od */}
              <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  📅 Data od
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md text-sm"
                />
              </div>

              {/* Data do */}
              <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  📅 Data do
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
