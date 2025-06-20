import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../Sidebar/Sidebar";
import { ExcelViewer } from "./ExcelUploader";

interface Review {
  id: number;
  text: string;
  rating: number;
  date: string;
  collectionTime: string;
  user?: {
    fullName: string;
    organization: string;
  };
}

interface User {
  id: number;
  fullName: string;
  organization: string;
  role: string;
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await fetch("http://localhost:3000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // Проверяем роль пользователя
          if (userData.role !== "tsar") {
            navigate("/dashboard");
          }
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/");
      }
    };

    fetchUserData();
  }, [navigate]);

  const refreshReviews = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const response = await fetch("http://localhost:3000/api/reviews", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Сортируем отзывы по ID (на всякий случай, хотя бэкенд уже должен их отсортировать)
        const sortedReviews = (data.reviews || []).sort(
          (a: Review, b: Review) => a.id - b.id
        );
        setReviews(sortedReviews);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Ошибка при получении отзывов");
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError("Ошибка при получении отзывов");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshReviews();
  }, [navigate]);

  if (!user || user.role !== "tsar") {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
        />
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <div className="max-w-7xl mx-auto">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p className="font-medium">Доступ запрещен</p>
                <p className="text-sm">
                  У вас нет прав для просмотра этой страницы. Только
                  пользователи с ролью tsar могут просматривать и загружать
                  отзывы.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {/* Header с кнопкой меню */}
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 mr-4 text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <h1 className="text-2xl font-semibold text-gray-800">
                  Загрузка отзывов
                </h1>
              </div>
            </div>
          </header>

          {/* Основной контент */}
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Загрузить Excel файл
              </h2>
              <ExcelViewer onUploadSuccess={refreshReviews} />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              </div>
            ) : reviews.length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          ID
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Текст отзыва
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Оценка
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Дата отзыва
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Время сбора
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Загрузил
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reviews.map((review) => (
                        <tr key={review.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {review.id}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xl break-words">
                              {review.text}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${
                                review.rating >= 4
                                  ? "bg-green-100 text-green-800"
                                  : review.rating >= 3
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {review.rating}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(review.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(review.collectionTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {review.user?.fullName || "Н/Д"}
                            <br />
                            <span className="text-xs text-gray-400">
                              {review.user?.organization || "Н/Д"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Нет загруженных отзывов
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
