import { Link, useLocation } from "react-router-dom";

interface User {
  id: number;
  fullName: string;
  organization: string;
  role: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4">
          {user && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600">
                {user.fullName}
              </h3>
              <p className="text-xs text-gray-500">{user.organization}</p>
              <p className="text-xs text-gray-400 mt-1">Роль: {user.role}</p>
            </div>
          )}
          <h2 className="text-xl font-bold text-black mb-6">Меню</h2>
          <nav>
            {/* Dashboard - visible to all users */}
            <Link
              to="/dashboard"
              className={`block py-2 px-4 rounded-lg mb-2 ${
                location.pathname === "/dashboard"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-blue-50"
              }`}
              onClick={onClose}
            >
              Главная страница
            </Link>

            {/* Reviews Upload - visible only to tsar */}
            {user?.role === "tsar" && (
              <Link
                to="/reviews"
                className={`block py-2 px-4 rounded-lg mb-2 ${
                  location.pathname === "/reviews"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-blue-50"
                }`}
                onClick={onClose}
              >
                Загрузка отзывов
              </Link>
            )}

            {/* Review Cards - visible to all users */}
            <Link
              to="/reviews/cards"
              className={`block py-2 px-4 rounded-lg mb-2 ${
                location.pathname === "/reviews/cards"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-blue-50"
              }`}
              onClick={onClose}
            >
              Все отзывы
            </Link>

            {/* Competitor Analysis - visible to all users */}
            <Link
              to="/competitor-analysis"
              className={`block py-2 px-4 rounded-lg mb-2 ${
                location.pathname === "/competitor-analysis"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-blue-50"
              }`}
              onClick={onClose}
            >
              Анализ конкурентов
            </Link>

            {/* AI Recommendations - visible to all users */}
            <Link
              to="/ai-recommendations"
              className={`block py-2 px-4 rounded-lg mb-2 ${
                location.pathname === "/ai-recommendations"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-blue-50"
              }`}
              onClick={onClose}
            >
              AI Рекомендации
            </Link>

            {/* Processed Reviews - visible only to tsar */}
            {user?.role === "tsar" && (
              <Link
                to="/processed-reviews"
                className={`block py-2 px-4 rounded-lg mb-2 ${
                  location.pathname === "/processed-reviews"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-blue-50"
                }`}
                onClick={onClose}
              >
                Обработанные отзывы
              </Link>
            )}

            {/* Counter Page - visible to all users */}
            <Link
              to="/counters"
              className={`block py-2 px-4 rounded-lg mb-2 ${
                location.pathname === "/counters"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-blue-50"
              }`}
              onClick={onClose}
            >
              Счетчики
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
