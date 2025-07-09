import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../Sidebar/Sidebar";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

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

interface ProcessedReview {
  id: number;
  sentiment?: string | null;
  competitorMention?: string | null;
  category?: string | null;
}

const CompetitorAnylize: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    negativeReviews: 0,
    criticalReviews: 0,
    competitorMentions: 0,
  });
  const [processedReviews, setProcessedReviews] = useState<ProcessedReview[]>(
    []
  );
  const [recommendations, setRecommendations] = useState<
    Record<string, string>
  >({});
  const [shouldGenerate, setShouldGenerate] = useState(false);
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

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
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

    fetchReviewStats();
  }, []);

  useEffect(() => {
    const fetchProcessedReviews = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
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
          setProcessedReviews(data.reviews);
        }
      } catch (error) {
        console.error("Error fetching processed reviews:", error);
      }
    };
    fetchProcessedReviews();
  }, []);

  // Pie chart data calculation
  const competitorPie = React.useMemo(() => {
    const isMention = (val: any) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "number") return val === 1;
      if (typeof val === "string")
        return ["true", "True", "TRUE", "1"].includes(val.trim());
      return false;
    };
    const withMention = processedReviews.filter((r) =>
      isMention(r.competitorMention)
    ).length;
    const withoutMention = processedReviews.length - withMention;
    return {
      labels: ["С упоминанием", "Без упоминания"],
      datasets: [
        {
          data: [withMention, withoutMention],
          backgroundColor: ["#a78bfa", "#e5e7eb"],
          borderWidth: 1,
        },
      ],
    };
  }, [processedReviews]);

  const sentimentPie = React.useMemo(() => {
    const sentiments: Record<string, number> = {};
    processedReviews.forEach((r) => {
      const s = r.sentiment || "Не определено";
      sentiments[s] = (sentiments[s] || 0) + 1;
    });
    return {
      labels: Object.keys(sentiments),
      datasets: [
        {
          data: Object.values(sentiments),
          backgroundColor: [
            "#f87171",
            "#fbbf24",
            "#34d399",
            "#60a5fa",
            "#a3e635",
            "#e5e7eb",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [processedReviews]);

  // Bar chart for categories (top pains)
  const categoryBar = React.useMemo(() => {
    const counts: Record<string, number> = {};
    processedReviews.forEach((r) => {
      if (r.category) {
        const cat = r.category.trim();
        if (cat) counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    // Сортируем по убыванию и берем топ-10
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    return {
      labels: sorted.map(([cat]) => cat),
      datasets: [
        {
          label: "Количество упоминаний",
          data: sorted.map(([, count]) => count),
          backgroundColor: "#818cf8",
        },
      ],
    };
  }, [processedReviews]);

  // Grouped bar chart: категории и позитив/негатив
  const categorySentimentBar = React.useMemo(() => {
    // Считаем для каждой категории количество позитивных и негативных
    const counts: Record<string, { positive: number; negative: number }> = {};
    processedReviews.forEach((r) => {
      if (r.category) {
        const cat = r.category.trim();
        if (!cat) return;
        const sentiment = (r.sentiment || "").toLowerCase();
        if (!counts[cat]) counts[cat] = { positive: 0, negative: 0 };
        if (sentiment === "позитивный") counts[cat].positive += 1;
        if (sentiment === "негативный") counts[cat].negative += 1;
      }
    });
    // Сортируем по сумме и берем топ-10
    const sorted = Object.entries(counts)
      .sort(
        (a, b) =>
          b[1].positive + b[1].negative - (a[1].positive + a[1].negative)
      )
      .slice(0, 10);
    return {
      labels: sorted.map(([cat]) => cat),
      datasets: [
        {
          label: "Позитивный",
          data: sorted.map(([, v]) => v.positive),
          backgroundColor: "#34d399",
        },
        {
          label: "Негативный",
          data: sorted.map(([, v]) => v.negative),
          backgroundColor: "#f87171",
        },
      ],
    };
  }, [processedReviews]);

  // Получаем уникальные темы (категории)
  const uniqueCategories = React.useMemo(() => {
    const set = new Set<string>();
    processedReviews.forEach((r) => {
      if (r.category) {
        const cat = r.category.trim();
        if (cat) set.add(cat);
      }
    });
    return Array.from(set);
  }, [processedReviews]);

  // Calculate frequencies for each category
  const categoryFrequencies = React.useMemo(() => {
    const freq: Record<string, number> = {};
    processedReviews.forEach((r) => {
      if (r.category) {
        const cat = r.category.trim();
        if (cat) freq[cat] = (freq[cat] || 0) + 1;
      }
    });
    return freq;
  }, [processedReviews]);

  // Calculate competitor frequencies for each category (only competitorMention = true)
  const competitorFrequencies = React.useMemo(() => {
    const freq: Record<string, number> = {};
    const isMention = (val: any) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "number") return val === 1;
      if (typeof val === "string")
        return ["true", "True", "TRUE", "1"].includes(val.trim());
      return false;
    };
    processedReviews.forEach((r) => {
      if (r.category && isMention(r.competitorMention)) {
        const cat = r.category.trim();
        if (cat) freq[cat] = (freq[cat] || 0) + 1;
      }
    });
    return freq;
  }, [processedReviews]);

  // Calculate difference in percent for each category (new logic)
  const categoryDiffPercent = React.useMemo(() => {
    const diff: Record<string, number> = {};
    uniqueCategories.forEach((cat) => {
      const total = categoryFrequencies[cat] || 0;
      const comp = competitorFrequencies[cat] || 0;
      if (total > 0) {
        diff[cat] = ((total - comp) / total) * 100;
      } else {
        diff[cat] = 0;
      }
    });
    return diff;
  }, [uniqueCategories, categoryFrequencies, competitorFrequencies]);

  // Получение сохранённых рекомендаций конкурентов из БД
  useEffect(() => {
    const fetchCompetitorRecommendations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(
          "http://localhost:3000/api/reviews/competitor-recommendations",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, string> = {};
          (data.recommendations || []).forEach((r: any) => {
            const key = r.category;
            map[key] = r.text;
          });
          setRecommendations(map);
        }
      } catch {}
    };
    fetchCompetitorRecommendations();
  }, [processedReviews]);

  // Генерация и сохранение рекомендаций конкурентов
  useEffect(() => {
    if (!shouldGenerate) return;
    const generateAll = async () => {
      const token = localStorage.getItem("token");
      for (const cat of uniqueCategories) {
        if (!recommendations[cat]) {
          try {
            const res = await fetch(
              "http://localhost:3000/api/reviews/competitor-recommendation",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ category: cat }),
              }
            );
            if (res.ok) {
              const data = await res.json();
              setRecommendations((prev) => ({
                ...prev,
                [cat]: data.recommendation,
              }));
            } else {
              setRecommendations((prev) => ({
                ...prev,
                [cat]: "Ошибка генерации",
              }));
            }
          } catch (error) {
            setRecommendations((prev) => ({
              ...prev,
              [cat]: "Ошибка запроса",
            }));
          }
        }
      }
    };
    generateAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldGenerate, uniqueCategories]);

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
          <h1 className="text-2xl font-bold text-blue-700">
            Анализ конкурентов
          </h1>
        </div>
      </header>
      <main className="container mx-auto pt-24 px-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Reviews */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500">
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-500">
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-500">
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500">
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

        {/* Pie charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-4">
              Доля отзывов о конкурентах
            </h2>
            <div className="w-64 h-64">
              <Pie data={competitorPie} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-4">Тональность отзывов</h2>
            <div className="w-64 h-64">
              <Pie data={sentimentPie} />
            </div>
          </div>
        </div>
        {/* Bar charts row: топ боли и grouped по эмоциям */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center min-h-[420px] min-w-[340px] md:min-w-[420px]">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Топ боли (категории)
            </h3>
            <div className="w-80 h-80">
              <Bar
                data={categoryBar}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  maintainAspectRatio: false,
                  scales: {
                    x: { title: { display: true } },
                    y: {
                      title: { display: true, text: "Количество" },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center min-h-[420px] min-w-[340px] md:min-w-[420px]">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Категории по эмоциям
            </h3>
            <div className="w-80 h-80">
              <Bar
                data={categorySentimentBar}
                options={{
                  responsive: true,
                  plugins: { legend: { display: true, position: "top" } },
                  maintainAspectRatio: false,
                  scales: {
                    x: { title: { display: true }, stacked: false },
                    y: {
                      title: { display: true, text: "Количество" },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Таблица тем и рекомендаций */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Таблица тем и рекомендаций
            </h3>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={() => setShouldGenerate(true)}
              disabled={shouldGenerate}
            >
              Сгенерировать рекомендации
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тема отзыва
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Частота
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Частота у конкурентов
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Разница
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Рекомендации
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uniqueCategories.map((cat, idx) => {
                  const diff = categoryDiffPercent[cat] || 0;
                  // Зеленый если обычная частота больше, красный если у конкурентов больше
                  const diffColor =
                    diff >= 0 ? "text-green-600" : "text-red-600";
                  // Специальные рекомендации для первых трех тем
                  let customRecommendation = undefined;
                  if (idx === 0) {
                    customRecommendation = `Условия сотрудничества: Оценивайте критерий удовлетворенности партнёров условиями сотрудничества. Регулярные опросы помогут выявить слабые места и улучшить договорные условия.`;
                  } else if (idx === 1) {
                    customRecommendation = `Персонал: Оцените критерий профессиональных навыков вашей команды. Регулярное проведение оценочных мероприятий поможет выявить сильные и слабые стороны сотрудников, что позволит нацелиться на обучение конкретным навыкам.`;
                  } else if (idx === 2) {
                    customRecommendation = `Надёжность компании: Сосредоточьтесь на критере отзывов и рейтингов. Поддерживайте положительную репутацию, активно отвечая на отзывы и достойно решая возникающие проблемы.`;
                  }
                  return (
                    <tr key={cat}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {cat}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                        {categoryFrequencies[cat] || 0}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                        {competitorFrequencies[cat] || 0}
                      </td>
                      <td
                        className={`px-4 py-2 whitespace-nowrap text-sm font-semibold text-center ${diffColor}`}
                      >
                        {diff >= 0 ? "+" : ""}
                        {diff.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 whitespace-pre-line text-sm text-gray italic text-black">
                        {customRecommendation ||
                          recommendations[cat] ||
                          "(рекомендация появится здесь)"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompetitorAnylize;
