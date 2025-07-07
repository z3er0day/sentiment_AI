import { useEffect, useState, useMemo } from "react";
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

export function CounterPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<ProcessedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch("http://localhost:3000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (e) {}
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch(
          "http://localhost:3000/api/reviews/processed",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
        } else {
          setError("Ошибка при получении данных");
        }
      } catch (e) {
        setError("Ошибка при получении данных");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Подсчеты
  const themeCount = useMemo(() => {
    const set = new Set(reviews.map((r) => r.theme).filter(Boolean));
    return set.size;
  }, [reviews]);
  const themeMap = useMemo(() => {
    const map: Record<string, number> = {};
    reviews.forEach((r) => {
      if (r.theme) map[r.theme] = (map[r.theme] || 0) + 1;
    });
    return map;
  }, [reviews]);
  const sentimentCount = useMemo(() => {
    const map: Record<string, number> = {};
    reviews.forEach((r) => {
      if (r.sentiment) map[r.sentiment] = (map[r.sentiment] || 0) + 1;
    });
    return map;
  }, [reviews]);
  const categoryCount = useMemo(() => {
    const set = new Set(reviews.map((r) => r.category).filter(Boolean));
    return set.size;
  }, [reviews]);
  const categoryMap = useMemo(() => {
    const map: Record<string, number> = {};
    reviews.forEach((r) => {
      if (r.category) map[r.category] = (map[r.category] || 0) + 1;
    });
    return map;
  }, [reviews]);
  const priorityCount = useMemo(() => {
    const set = new Set(reviews.map((r) => r.priority).filter(Boolean));
    return set.size;
  }, [reviews]);
  const priorityMap = useMemo(() => {
    const map: Record<string, number> = {};
    reviews.forEach((r) => {
      if (r.priority) map[r.priority] = (map[r.priority] || 0) + 1;
    });
    return map;
  }, [reviews]);
  const competitorCount = useMemo(() => {
    return reviews.filter((r) => r.competitorMention).length;
  }, [reviews]);
  const competitorMap = useMemo(() => {
    const map: Record<string, number> = {};
    reviews.forEach((r) => {
      if (r.competitorMention)
        map[r.competitorMention] = (map[r.competitorMention] || 0) + 1;
    });
    return map;
  }, [reviews]);
  const tagsCount = useMemo(() => {
    const tags = reviews.flatMap((r) => r.tags || []);
    const set = new Set(tags);
    return set.size;
  }, [reviews]);
  const tagsMap = useMemo(() => {
    const map: Record<string, number> = {};
    reviews.forEach((r) => {
      (r.tags || []).forEach((tag) => {
        map[tag] = (map[tag] || 0) + 1;
      });
    });
    return map;
  }, [reviews]);
  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return (
      reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    );
  }, [reviews]);

  // Категории для выбранной темы
  const selectedThemeCategories = useMemo(() => {
    if (!selectedTheme) return {};
    const map: Record<string, number> = {};
    reviews.forEach((r) => {
      if (r.theme === selectedTheme && r.category) {
        map[r.category] = (map[r.category] || 0) + 1;
      }
    });
    return map;
  }, [reviews, selectedTheme]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />
      <div className="flex-1 overflow-auto">
        <div className="p-4">
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
                  Счетчики аналитики отзывов
                </h1>
              </div>
            </div>
          </header>
          <div className="max-w-7xl mx-auto mt-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {themeCount}
                  </div>
                  <div className="text-gray-600">Различных тем</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(themeMap).map(([k, v]) => (
                      <button
                        key={k}
                        className={`text-xs bg-green-100 text-green-700 rounded px-2 py-1 focus:outline-none ${
                          selectedTheme === k ? "ring-2 ring-green-500" : ""
                        }`}
                        onClick={() =>
                          setSelectedTheme(selectedTheme === k ? null : k)
                        }
                      >
                        {k}: {v}
                      </button>
                    ))}
                  </div>
                  {selectedTheme && (
                    <div className="mt-4 w-full">
                      <div className="font-semibold text-sm mb-2 text-left">
                        Категории для темы:{" "}
                        <span className="text-green-700">{selectedTheme}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedThemeCategories).length ===
                        0 ? (
                          <span className="text-xs text-gray-400">
                            Нет категорий
                          </span>
                        ) : (
                          Object.entries(selectedThemeCategories).map(
                            ([cat, count]) => (
                              <span
                                key={cat}
                                className="text-xs bg-yellow-100 text-yellow-700 rounded px-2 py-1"
                              >
                                {cat}: {count}
                              </span>
                            )
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {Object.values(sentimentCount).reduce((a, b) => a + b, 0)}
                  </div>
                  <div className="text-gray-600">Тональностей (всего)</div>
                  <div className="flex gap-2 mt-2">
                    {Object.entries(sentimentCount).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-1"
                      >
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {categoryCount}
                  </div>
                  <div className="text-gray-600">Категорий</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(categoryMap).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-xs bg-yellow-100 text-yellow-700 rounded px-2 py-1"
                      >
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {priorityCount}
                  </div>
                  <div className="text-gray-600">Приоритетов</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(priorityMap).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-xs bg-purple-100 text-purple-700 rounded px-2 py-1"
                      >
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {competitorCount}
                  </div>
                  <div className="text-gray-600">Связей с конкурентами</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(competitorMap).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-xs bg-red-100 text-red-700 rounded px-2 py-1"
                      >
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {tagsCount}
                  </div>
                  <div className="text-gray-600">Тегов</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(tagsMap).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-xs bg-pink-100 text-pink-700 rounded px-2 py-1"
                      >
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {avgRating.toFixed(2)}
                  </div>
                  <div className="text-gray-600">Средний рейтинг</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
