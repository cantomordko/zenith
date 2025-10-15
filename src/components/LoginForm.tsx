'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import toast from 'react-hot-toast';

export default function LoginForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log('Supabase connection test:', { data, error });
      
      if (error) {
        toast.error('Błąd połączenia: ' + error.message);
      } else {
        toast.success('Połączenie z Supabase działa! ✅');
      }
    } catch (err: any) {
      console.error('Connection test failed:', err);
      toast.error('Nie można połączyć z Supabase');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      toast.success('Zalogowano pomyślnie!');
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Lepsze komunikaty błędów
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Nieprawidłowy email lub hasło. Sprawdź dane lub zarejestruj się.');
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Email nie został potwierdzony. Sprawdź skrzynkę pocztową.');
      } else {
        toast.error(error.message || 'Błąd logowania');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'user', // Domyślna rola
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }

      console.log('Signup success:', data);
      toast.success('Konto utworzone! Możesz się teraz zalogować.');
      setIsLogin(true);
      setPassword('');
    } catch (error: any) {
      console.error('Signup failed:', error);
      toast.error(error.message || 'Błąd rejestracji');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎫</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
              Zenith System
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isLogin ? 'Zaloguj się do swojego konta' : 'Utwórz nowe konto'}
            </p>
          </div>

          {/* Toggle Login/Signup */}
          <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Logowanie
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Rejestracja
            </button>
          </div>

          {/* Form */}
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  👤 Imię i nazwisko
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jan Kowalski"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                📧 Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.com"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                🔒 Hasło
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum 6 znaków
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isLogin ? 'Logowanie...' : 'Rejestracja...'}
                </>
              ) : (
                <>
                  {isLogin ? '🚀 Zaloguj się' : '✨ Utwórz konto'}
                </>
              )}
            </button>
          </form>

          {/* Test connection button */}
          <button
            type="button"
            onClick={testConnection}
            className="w-full py-2 mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            🔧 Testuj połączenie z Supabase
          </button>

          {/* Demo credentials info */}
          {isLogin && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">
                💡 Demo Access:
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Email: <code className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded">demo@helpdesk.com</code><br />
                Hasło: <code className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded">demo123</code>
              </p>
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            ← Wróć do strony głównej
          </a>
        </div>
      </div>
    </div>
  );
}
