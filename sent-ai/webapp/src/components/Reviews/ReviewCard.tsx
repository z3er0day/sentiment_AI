import { useState, useEffect } from "react";
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
  createdAt: string;
}

const ReviewCard = () => {
  const [reviews, setReviews] = useState<ProcessedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Эффект для загрузки пользовательских данных
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
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
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Эффект для загрузки отзывов
  useEffect(() => {
    const fetchProcessedReviews = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
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
          setReviews(data.reviews || []);
        } else {
          setError("Ошибка при загрузке отзывов");
        }
      } catch (error) {
        setError("Ошибка при загрузке отзывов");
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProcessedReviews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "bg-green-100 border-green-500";
      case "negative":
        return "bg-red-100 border-red-500";
      case "neutral":
        return "bg-gray-100 border-gray-500";
      default:
        return "bg-white border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />
      <header className="bg-white shadow flex justify-between items-center py-4 px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-blue-100 mr-2"
            aria-label="Открыть меню"
          >
            <svg
              className="h-6 w-6 text-blue-700"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-blue-700">Все отзывы</h1>
        </div>
      </header>
      {/* Основной контент */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`w-full rounded-lg p-6 border ${getSentimentColor(
                review.sentiment
              )} shadow-sm hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex flex-col gap-4">
                {/* Заголовок с ID, датами и оценкой */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        ID отзыва:
                      </span>
                      <span className="text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-mono">
                        #{review.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Дата сбора:
                      </span>
                      <span className="text-sm text-gray-600">
                        {review.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Время сбора:
                      </span>
                      <span className="text-sm text-gray-600">
                        {review.collectionTime}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Оценка:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        review.rating >= 4
                          ? "bg-green-100 text-green-800"
                          : review.rating >= 3
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {review.rating}
                    </span>
                  </div>
                </div>

                {/* Основное содержание */}
                <div className="space-y-4">
                  {/* Текст отзыва */}
                  <div>
                    <h3 className="text-gray-700 font-medium mb-2">
                      Текст отзыва:
                    </h3>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">
                      {review.text}
                    </p>
                  </div>

                  {/* Анализ отзыва */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-gray-700 font-medium mb-2">Тема:</h3>
                      <p className="text-gray-600">{review.theme || "—"}</p>
                    </div>
                    <div>
                      <h3 className="text-gray-700 font-medium mb-2">
                        Тональность:
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          review.sentiment?.toLowerCase() === "positive"
                            ? "bg-green-100 text-green-800"
                            : review.sentiment?.toLowerCase() === "negative"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {review.sentiment || "—"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-gray-700 font-medium mb-2">
                        Категория:
                      </h3>
                      <p className="text-gray-600">{review.category || "—"}</p>
                    </div>
                    <div>
                      <h3 className="text-gray-700 font-medium mb-2">
                        Приоритет:
                      </h3>
                      <p className="text-gray-600">{review.priority || "—"}</p>
                    </div>
                  </div>

                  {/* Дополнительная информация */}
                  <div className="border-t pt-4 mt-4">
                    <div className="mb-3">
                      <h3 className="text-gray-700 font-medium mb-2">
                        Упоминание конкурента:
                      </h3>
                      <p className="text-gray-600">
                        {review.competitorMention || "—"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-gray-700 font-medium mb-2">Метки:</h3>
                      <div className="flex flex-wrap gap-2">
                        {review.tags && review.tags.length > 0 ? (
                          review.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              Нет обработанных отзывов
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
