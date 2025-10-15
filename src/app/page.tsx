import KanbanBoard from '@/components/KanbanBoard';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors pt-20">
        <div className="container mx-auto py-8 px-6">
          <header className="mb-10">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 bg-clip-text">
              <h1 className="text-5xl font-black text-transparent mb-3 tracking-tight">
                🎯 Zenith Kanban
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
              Zarządzaj zgłoszeniami z Zenith — osiągnij szczyt swojej produktywności
            </p>
          </header>
          
          <KanbanBoard />
        </div>
      </main>
    </ProtectedRoute>
  );
}
