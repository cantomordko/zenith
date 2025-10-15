'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, isLoading, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  if (isLoading) {
    return (
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 shadow-md sticky top-0 z-50 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo i tytuł */}
        <div className="flex items-center gap-3">
          <div className="text-3xl">🎫</div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Zenith
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Osiągnij szczyt swojej produktywności.
            </p>
          </div>
        </div>

        {/* Prawy panel */}
        <div className="flex items-center gap-3 md:gap-4">
          <ThemeToggle />
          
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold">{user.email?.split('@')[0]}</p>
                  <p className="text-xs opacity-80">{user.user_metadata?.role || 'User'}</p>
                </div>
                <span className="text-lg">▼</span>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 animate-slideDown">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Rola: {user.user_metadata?.role || 'User'}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  >
                    <span className="text-lg">🚪</span>
                    Wyloguj się
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/login"
              className="px-4 md:px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-sm md:text-base"
            >
              Zaloguj się
            </a>
          )}
        </div>
      </div>

      {/* Kliknięcie poza menu zamyka je */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
}
