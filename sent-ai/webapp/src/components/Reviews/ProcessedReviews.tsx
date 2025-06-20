import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../Sidebar/Sidebar";

interface User {
  id: number;
  fullName: string;
  organization: string;
  role: string;
}

interface ProcessedReview {
  id: number;
  text: string;
  rating: number;
  date: string;
  collectionTime: string;
  theme: string | null;
  sentiment: string | null;
  category: string | null;
  priority: string | null;
  competitorMention: string | null;
  tags: string[] | null;
  user?: {
    fullName: string;
    organization: string;
  };
}

export const ProcessedReviews: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<ProcessedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
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

  const fetchProcessedReviews = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const response = await fetch(
        "http://localhost:3000/api/reviews/processed",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Сортируем отзывы по ID
        const sortedReviews = (data.reviews || []).sort(
          (a: ProcessedReview, b: ProcessedReview) => a.id - b.id
        );
        setReviews(sortedReviews);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Ошибка при получении обработанных отзывов"
        );
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching processed reviews:", error);
      setError("Ошибка при получении обработанных отзывов");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessedReviews();
  }, [navigate]);


  // Автоматически копировать отзывы, если ProcessedReview пуст
  useEffect(() => {
    if (!loading && reviews.length === 0) {
      const autoCopy = async () => {
        setProcessing(true);
        setError(null);
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            navigate("/");
            return;
          }
          const response = await fetch(
            "http://localhost:3000/api/reviews/copy-all-to-processed",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (response.ok) {
            await fetchProcessedReviews();
          } else {
            const errorData = await response.json();
            setError(errorData.error || "Ошибка при копировании отзывов");
          }
        } catch (error) {
          setError("Ошибка при копировании отзывов");
        } finally {
          setProcessing(false);
        }
      };
      autoCopy();
    }
    // eslint-disable-next-line
  }, [loading, reviews.length]);

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

  // Последовательная обработка всех отзывов с обновлением таблицы после каждого
  const handleProcessAllReviewsSequential = async () => {
    setProcessing(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      for (let i = 0; i < reviews.length; i++) {
        const review = reviews[i];
        // Анализ темы
        const themeResp = await fetch(
          "http://localhost:3000/api/reviews/analyze-theme",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: review.text }),
          }
        );
        if (themeResp.ok) {
          const data = await themeResp.json();
          await fetch("http://localhost:3000/api/reviews/update-theme", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: review.id, theme: data.theme }),
          });
        }
        // Анализ категории
        await fetch("http://localhost:3000/api/reviews/analyze-category", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: review.id, text: review.text }),
        });
        // Анализ тегов
        await fetch("http://localhost:3000/api/reviews/analyze-tags", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: review.id, text: review.text }),
        });
        // Анализ тональности
        await fetch("http://localhost:3000/api/reviews/analyze-sentiment", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: review.id, text: review.text }),
        });
        // Анализ приоритета
        await fetch("http://localhost:3000/api/reviews/analyze-priority", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: review.id, text: review.text }),
        });
        // Анализ упоминания конкурента
        await fetch("http://localhost:3000/api/reviews/analyze-competitor", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: review.id, text: review.text }),
        });
        // Обновить таблицу после каждого
        await fetchProcessedReviews();
      }
    } catch (error) {
      setError("Ошибка при анализе отзывов");
    } finally {
      setProcessing(false);
    }
  };

  // Массовое удаление анализа для всех ProcessedReview
  const handleClearAllAnalysis = async () => {
    setProcessing(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      for (let i = 0; i < reviews.length; i++) {
        const review = reviews[i];
        await fetch(
          "http://localhost:3000/api/reviews/update-analysis-fields",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: review.id,
              theme: null,
              sentiment: null,
              category: null,
              priority: null,
              competitorMention: null,
              tags: null,
            }),
          }
        );
        await fetchProcessedReviews();
      }
    } catch (error) {
      setError("Ошибка при удалении анализа");
    } finally {
      setProcessing(false);
    }
  };

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
                  пользователи с ролью tsar могут просматривать обработанные
                  отзывы.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  Обработанные отзывы
                </h1>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto">
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleProcessAllReviewsSequential}
                disabled={processing}
                className={`px-6 py-2 rounded-lg font-semibold text-white ${
                  processing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                } transition-colors`}
              >
                {processing ? "Обработка..." : "Обработать все отзывы"}
              </button>
            </div>

            <div className="mb-4 flex justify-end">
              <button
                onClick={handleClearAllAnalysis}
                disabled={processing}
                className={`px-6 py-2 rounded-lg font-semibold text-white ${
                  processing ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
                } transition-colors`}
              >
                {processing ? "Удаление..." : "Удалить анализ отзывов"}
              </button>
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
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[600px]"
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
                          Тема
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Тональность
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Категория
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Приоритет
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Упоминание конкурента
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Метки
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
                          <td className="px-6 py-4 min-w-[400px]">
                            <div className="text-sm text-gray-900 break-words">
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
                            {review.theme || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {review.sentiment || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {review.category || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {review.priority || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {review.competitorMention || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {review.tags ? review.tags.join(", ") : "—"}
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
                Нет обработанных отзывов
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessedReviews;
