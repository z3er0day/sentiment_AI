import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../Sidebar/Sidebar";

interface User {
  id: number;
  fullName: string;
  organization: string;
  role: string;
}

interface ReviewStats {
  totalReviews: number;
  negativeReviews: number;
  criticalReviews: number;
  competitorMentions: number;
}

interface TopCategory {
  category: string;
  priority: string;
  count: number;
}

interface ProcessedReviewRow {
  id: number;
  text: string;
  rating: number;
  priority: string | null;
  category: string | null;
  aiRecommendation: string | null;
  status: string | null;
}

const PRIORITY_ORDER = ["Очень важный", "Важный", "Обычный "];

const AIrecommendations: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    negativeReviews: 0,
    criticalReviews: 0,
    competitorMentions: 0,
  });
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [countFilter, setCountFilter] = useState<number | null>(null);
  const [templates, setTemplates] = useState<
    { category: string; theme: string }[]
  >([]);
  const [generatedResponses, setGeneratedResponses] = useState<{
    [key: string]: string;
  }>({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [errorAll, setErrorAll] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [processedReviews, setProcessedReviews] = useState<
    ProcessedReviewRow[]
  >([]);
  const [loadingProcessed, setLoadingProcessed] = useState(false);
  const [errorProcessed, setErrorProcessed] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ProcessedReviewRow;
    direction: "asc" | "desc";
  } | null>(null);
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
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/");
      }
    };

    const fetchReviewStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch(
          "http://localhost:3000/api/reviews/stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const statsData = await response.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error("Error fetching review statistics:", error);
      }
    };

    const fetchTopCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch(
          "http://localhost:3000/api/reviews/top-categories",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setTopCategories(data);
        }
      } catch (error) {
        console.error("Error fetching top categories:", error);
      }
    };

    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch(
          "http://localhost:3000/api/reviews/processed",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          // Оставляем только уникальные пары категория/тема
          const unique: Record<string, { category: string; theme: string }> =
            {};
          (data.reviews || []).forEach((r: any) => {
            if (r.category && r.theme) {
              const key = r.category + "|" + r.theme;
              if (!unique[key])
                unique[key] = { category: r.category, theme: r.theme };
            }
          });
          setTemplates(Object.values(unique));
        }
      } catch (error) {
        // ignore
      }
    };

    // Получение сохранённых AI-рекомендаций из БД
    const fetchAIRecommendations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(
          "http://localhost:3000/api/reviews/ai-recommendations",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const map: { [key: string]: string } = {};
          (data.recommendations || []).forEach((r: any) => {
            const key = r.category + "|" + (r.theme || "");
            map[key] = r.text;
          });
          setGeneratedResponses(map);
        }
      } catch {}
    };

    // Получение обработанных отзывов для таблицы рекомендаций
    const fetchProcessed = async () => {
      setLoadingProcessed(true);
      setErrorProcessed(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:3000/api/reviews/processed", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Преобразуем данные для таблицы
          const rows: ProcessedReviewRow[] = (data.reviews || []).map(
            (r: any) => ({
              id: r.id,
              text: r.text,
              rating: r.rating,
              priority: r.priority,
              category: r.category,
              aiRecommendation: r.aiRecommendation || null, // если есть поле
              status: r.status || null, // если есть поле
            })
          );
          setProcessedReviews(rows);
        } else {
          setErrorProcessed("Ошибка загрузки обработанных отзывов");
        }
      } catch (e) {
        setErrorProcessed("Ошибка загрузки обработанных отзывов");
      } finally {
        setLoadingProcessed(false);
      }
    };

    fetchUserData();
    fetchReviewStats();
    fetchTopCategories();
    fetchTemplates();
    fetchAIRecommendations();
    fetchProcessed();
  }, [navigate]);

  // Сортировка и фильтрация топа
  const filteredCategories = topCategories
    .filter((cat) =>
      priorityFilter
        ? cat.priority.trim().toLowerCase() ===
          priorityFilter.trim().toLowerCase()
        : true
    )
    .filter((cat) => (countFilter ? cat.count >= countFilter : true));

  const sortedFilteredCategories = filteredCategories.sort((a, b) => {
    const prioA = PRIORITY_ORDER.findIndex(
      (p) => p.toLowerCase().trim() === (a.priority || "").toLowerCase().trim()
    );
    const prioB = PRIORITY_ORDER.findIndex(
      (p) => p.toLowerCase().trim() === (b.priority || "").toLowerCase().trim()
    );
    if (prioA !== prioB) return prioA - prioB;
    return b.count - a.count;
  });

  const visibleCategories = showAllCategories
    ? sortedFilteredCategories
    : sortedFilteredCategories.slice(0, 5);

  // Группируем шаблоны по категории и теме, считаем количество
  const groupedTemplates = React.useMemo(() => {
    const map: Record<
      string,
      { category: string; theme: string; count: number }
    > = {};
    templates.forEach((tpl) => {
      const key = tpl.category + "|" + tpl.theme;
      if (!map[key]) {
        map[key] = { ...tpl, count: 1 };
      } else {
        map[key].count++;
      }
    });
    // Сортируем по количеству по убыванию
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [templates]);

  // Генерация ответов для всех видимых строк
  const handleGenerateAllResponses = async () => {
    setLoadingAll(true);
    setErrorAll(null);
    const newResponses: { [key: string]: string } = {};
    try {
      const token = localStorage.getItem("token");
      for (const tpl of visibleTemplates) {
        const key = tpl.category + "|" + tpl.theme;
        const res = await fetch(
          "http://localhost:3000/api/reviews/ai-recommendation",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ category: tpl.category, theme: tpl.theme }),
          }
        );
        if (!res.ok) {
          newResponses[key] = "Ошибка генерации";
        } else {
          const data = await res.json();
          newResponses[key] = data.recommendation || "Нет ответа";
        }
      }
      setGeneratedResponses((prev) => ({ ...prev, ...newResponses }));
    } catch (e) {
      setErrorAll("Ошибка генерации ответов");
    } finally {
      setLoadingAll(false);
    }
  };

  // Показываем либо 5, либо все строки
  const visibleTemplates: { category: string; theme: string; count: number }[] =
    expanded ? groupedTemplates : groupedTemplates.slice(0, 5);

  // Возможные статусы и подписи
  const STATUS_CYCLE = [
    {
      value: "not_resolved",
      label: "Не решено",
      color: "bg-red-100 text-red-700 border-red-300",
    },
    {
      value: "in_progress",
      label: "В работе",
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    },
    {
      value: "resolved",
      label: "Решено",
      color: "bg-green-100 text-green-700 border-green-300",
    },
  ];

  // Функция для смены статуса по кругу
  const handleStatusCycle = async (
    id: number,
    currentStatus: string | null
  ) => {
    const idx = STATUS_CYCLE.findIndex((s) => s.value === currentStatus);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(
        `http://localhost:3000/api/reviews/processed/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: next.value }),
        }
      );
      if (res.ok) {
        setProcessedReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: next.value } : r))
        );
      }
    } catch {}
  };

  // Функция для сортировки
  const sortedProcessedReviews = React.useMemo(() => {
    if (!sortConfig) return processedReviews;
    const sorted = [...processedReviews];
    sorted.sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue = a[key];
      let bValue = b[key];
      // Для числовых значений
      if (key === "id" || key === "rating") {
        aValue = aValue ?? 0;
        bValue = bValue ?? 0;
        return direction === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
      // Для строковых значений
      aValue = (aValue ?? "").toString().toLowerCase();
      bValue = (bValue ?? "").toString().toLowerCase();
      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [processedReviews, sortConfig]);

  // Обновляем visibleReviews для сортировки
  const visibleReviews: ProcessedReviewRow[] = showAllReviews
    ? sortedProcessedReviews
    : sortedProcessedReviews.slice(0, 5);

  // Функция для обработки клика по заголовку
  const handleSort = (key: keyof ProcessedReviewRow) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        // Меняем направление
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
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
          <h1 className="text-2xl font-bold text-blue-700">AI Рекомендации</h1>
        </div>
      </header>
      <main className="container mx-auto pt-24 px-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Reviews */}
          <div className="bg-gradient-to-r from-blue-200 to-green-200 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">
                  Всего отзывов
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalReviews}
                </p>
              </div>
            </div>
          </div>
          {/* Negative Reviews */}
          <div className="bg-gradient-to-r from-blue-200 to-green-200 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">
                  Негативные отзывы
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.negativeReviews}
                </p>
              </div>
            </div>
          </div>
          {/* Critical Reviews */}
          <div className="bg-gradient-to-r from-blue-200 to-green-200 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">
                  Критически важные
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.criticalReviews}
                </p>
              </div>
            </div>
          </div>
          {/* Competitor Mentions */}
          <div className="bg-gradient-to-r from-blue-200 to-green-200 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">
                  Упоминания конкурентов
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.competitorMentions}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Top Categories Block */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">
            Топ по категориям и приоритетам
          </h2>
          {/* Фильтры */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Приоритет:
              </label>
              <select
                className="border rounded px-2 py-1"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">Все</option>
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Мин. кол-во:
              </label>
              <input
                type="number"
                min={1}
                className="border rounded px-2 py-1 w-24"
                value={countFilter ?? ""}
                onChange={(e) =>
                  setCountFilter(e.target.value ? Number(e.target.value) : null)
                }
                placeholder="Любое"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Категория
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Приоритет
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Кол-во
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleCategories.map((cat, idx) => (
                  <tr
                    key={cat.category + cat.priority}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 font-semibold">{idx + 1}</td>
                    <td className="px-4 py-2">{cat.category}</td>
                    <td className="px-4 py-2">{cat.priority}</td>
                    <td className="px-4 py-2">{cat.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {topCategories.length > 5 && (
              <div className="flex justify-end mt-2">
                <button
                  className="text-blue-600 hover:underline text-sm"
                  onClick={() => setShowAllCategories((v) => !v)}
                >
                  {showAllCategories ? "Скрыть" : "Показать все"}
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Templates Table */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">
            Шаблоны ответа на проблему
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Категория
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Проблема
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase flex items-center gap-2">
                    Пример ответа
                    <button
                      className="ml-2 bg-gradient-to-r from-blue-400 to-green-400 text-white px-3 py-1 rounded shadow hover:from-blue-500 hover:to-green-500 disabled:opacity-50 text-xs"
                      disabled={loadingAll || visibleTemplates.length === 0}
                      onClick={handleGenerateAllResponses}
                    >
                      {loadingAll ? "Генерация..." : "Сгенерировать ответы"}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-400 py-4">
                      Нет данных
                    </td>
                  </tr>
                ) : (
                  visibleTemplates.map((tpl) => {
                    const key = tpl.category + "|" + tpl.theme;
                    return (
                      <tr key={key}>
                        <td className="px-4 py-2">{tpl.category}</td>
                        <td className="px-4 py-2">
                          {tpl.theme}{" "}
                          <span className="text-xs text-gray-400">
                            ({tpl.count})
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-900">
                          {loadingAll ? (
                            <span className="text-blue-500 animate-pulse">
                              Генерация...
                            </span>
                          ) : errorAll ? (
                            <span className="text-red-500">{errorAll}</span>
                          ) : generatedResponses[key] ? (
                            <span>{generatedResponses[key]}</span>
                          ) : (
                            <span className="text-gray-400 italic">
                              (пример ответа...)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <div className="flex justify-end mt-2 gap-2">
              {groupedTemplates.length > 5 && (
                <button
                  className="text-blue-600 hover:underline text-sm"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? "Свернуть" : "Показать все"}
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Таблица обработанных отзывов с рекомендациями ИИ */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">
            Обработанные отзывы и AI рекомендации
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort("id")}
                  >
                    ID{" "}
                    {sortConfig?.key === "id" &&
                      (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort("text")}
                  >
                    Текст{" "}
                    {sortConfig?.key === "text" &&
                      (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort("rating")}
                  >
                    Оценка{" "}
                    {sortConfig?.key === "rating" &&
                      (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort("priority")}
                  >
                    Приоритет{" "}
                    {sortConfig?.key === "priority" &&
                      (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort("category")}
                  >
                    Категория{" "}
                    {sortConfig?.key === "category" &&
                      (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    AI рекомендация
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingProcessed ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      Загрузка...
                    </td>
                  </tr>
                ) : errorProcessed ? (
                  <tr>
                    <td colSpan={7} className="text-center text-red-500 py-4">
                      {errorProcessed}
                    </td>
                  </tr>
                ) : processedReviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-4">
                      Нет данных
                    </td>
                  </tr>
                ) : (
                  visibleReviews.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{r.id}</td>
                      <td className="px-4 py-2">
                        {r.text.split(" ").slice(0, 5).join(" ")}...
                      </td>
                      <td className="px-4 py-2">{r.rating}</td>
                      <td className="px-4 py-2">{r.priority || "—"}</td>
                      <td className="px-4 py-2">{r.category || "—"}</td>
                      <td className="px-4 py-2">
                        {r.aiRecommendation || (
                          <span className="text-gray-400 italic">(нет)</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {(() => {
                          // Для корректного цикла: если статус null или невалидный, начинаем с первого
                          const idx = STATUS_CYCLE.findIndex(
                            (s) => s.value === r.status
                          );
                          const statusObj =
                            idx === -1 ? STATUS_CYCLE[0] : STATUS_CYCLE[idx];
                          return (
                            <button
                              className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${statusObj.color}`}
                              onClick={() =>
                                handleStatusCycle(r.id, statusObj.value)
                              }
                              type="button"
                            >
                              {statusObj.label}
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {processedReviews.length > 5 && (
            <div className="flex justify-end mt-2">
              <button
                className="text-blue-600 hover:underline text-sm"
                onClick={() => setShowAllReviews((v) => !v)}
              >
                {showAllReviews ? "Скрыть" : "Показать все"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AIrecommendations;
