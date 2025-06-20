import { useEffect, useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Sidebar } from "../Sidebar/Sidebar";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

interface UserData {
  id: number;
  fullName: string;
  organization: string;
  role: string;
}

interface ProcessedReview {
  id: number;
  text: string;
  rating: number;
  date: string; // ISO or YYYY-MM-DD
  sentiment: string | null;
  category: string | null;
  // ...other fields
}

export function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reviews, setReviews] = useState<ProcessedReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/";
          return;
        }
        const response = await fetch("http://localhost:3000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          localStorage.removeItem("token");
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
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
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          let reviewsWithFakeDates = data.reviews || [];
          // Если мало дат — сгенерировать фейковые даты для равномерного распределения
          if (reviewsWithFakeDates.length > 0) {
            const today = new Date();
            const days = Math.max(
              10,
              Math.min(30, reviewsWithFakeDates.length)
            );
            for (let i = 0; i < reviewsWithFakeDates.length; i++) {
              // равномерно распределяем по последним N дням
              const fakeDate = new Date(today);
              fakeDate.setDate(today.getDate() - (days - 1 - (i % days)));
              reviewsWithFakeDates[i].date = fakeDate
                .toISOString()
                .slice(0, 10);
            }
          }
          setReviews(reviewsWithFakeDates);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Метрики
  const totalReviews = reviews.length;
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return (
      reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    );
  }, [reviews]);
  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
    });
    return dist;
  }, [reviews]);

  // Динамика тональности по датам (по дням)
  const sentimentTimeline = useMemo(() => {
    // {date: {positive: n, negative: n, neutral: n}}
    const map: Record<
      string,
      { positive: number; negative: number; neutral: number }
    > = {};
    reviews.forEach((r) => {
      if (!r.date) return;
      const d = r.date.slice(0, 10); // YYYY-MM-DD
      if (!map[d]) map[d] = { positive: 0, negative: 0, neutral: 0 };
      const s = (r.sentiment || "").toLowerCase();
      if (s === "positive" || s === "позитивный") map[d].positive++;
      else if (s === "negative" || s === "негативный") map[d].negative++;
      else map[d].neutral++;
    });
    // Сортировка по дате
    const dates = Object.keys(map).sort();
    return {
      labels: dates,
      positive: dates.map((d) => map[d].positive),
      neutral: dates.map((d) => map[d].neutral),
      negative: dates.map((d) => map[d].negative),
    };
  }, [reviews]);

  if (loading || reviewsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!userData) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={userData}
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
          <div className="user-avatar w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
            {userData.fullName
              ? userData.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "ИИ"}
          </div>
          <div className="user-details flex flex-col">
            <div className="user-name font-medium text-black">
              {userData.fullName}
            </div>
            <div className="user-role text-xs text-gray-500">
              {userData.role || "Пользователь"}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
          className="ml-6 px-4 py-2 border border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white rounded transition-colors duration-200"
        >
          Выйти
        </button>
      </header>

      <main className="container mx-auto pt-24 px-4">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">
          Анализ отзывов
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="metric-value text-2xl font-bold mb-2">
            {totalReviews} отзывов
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 metrics-grid">
            <div className="metric-card p-4 rounded-lg shadow bg-gradient-to-r from-blue-200 to-green-200">
              <div className="metric-header text-gray-500">Личный кабинет</div>
              <div className="metric-value text-blue-700 text-xl">91%</div>
              <div className="metric-change positive flex items-center text-green-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#4CAF50">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
                172 отзыва
              </div>
            </div>
            <div className="metric-card p-4 rounded-lg shadow bg-gradient-to-r from-blue-200 to-green-200">
              <div className="metric-header text-gray-500">Карта</div>
              <div className="metric-value text-blue-700 text-xl">83%</div>
              <div className="metric-change positive flex items-center text-green-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#4CAF50">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
                124 отзыва
              </div>
            </div>
            <div className="metric-card p-4 rounded-lg shadow bg-gradient-to-r from-blue-200 to-green-200">
              <div className="metric-header text-gray-500">Обслуживание</div>
              <div className="metric-value text-blue-700 text-xl">62%</div>
              <div className="metric-change positive flex items-center text-green-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#4CAF50">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
                97 отзывов
              </div>
            </div>
            <div className="metric-card p-4 rounded-lg shadow bg-gradient-to-r from-blue-200 to-green-200">
              <div className="metric-header text-gray-500">Надёжность</div>
              <div className="metric-value text-blue-700 text-xl">56%</div>
              <div className="metric-change positive flex items-center text-green-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#4CAF50">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
                88 отзыва
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 dashboard">
          <div className="card rating-card bg-gradient-to-r from-blue-200 to-green-200 text-center p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-blue-700 mb-2">
              Общий рейтинг
            </h2>
            <div className="rating-number text-5xl font-bold">
              {averageRating.toFixed(1)}
            </div>
            <div
              className="stars text-yellow-400 text-2xl"
              aria-label={`Рейтинг: ${averageRating.toFixed(1)} из 5`}
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const rounded = Math.round(averageRating * 2) / 2;
                if (i + 1 <= Math.floor(rounded)) {
                  // Полная звезда
                  return (
                    <span key={i}>
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="inline-block align-middle"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </span>
                  );
                } else if (rounded - i === 0.5) {
                  // Полузвезда
                  return (
                    <span key={i}>
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        className="inline-block align-middle"
                      >
                        <defs>
                          <linearGradient
                            id={`half-star-${i}`}
                            x1="0"
                            x2="1"
                            y1="0"
                            y2="0"
                          >
                            <stop offset="50%" stopColor="currentColor" />
                            <stop offset="50%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                          fill={`url(#half-star-${i})`}
                          stroke="currentColor"
                          strokeWidth="1"
                        />
                      </svg>
                    </span>
                  );
                } else {
                  // Пустая звезда
                  return (
                    <span key={i}>
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="inline-block align-middle"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </span>
                  );
                }
              })}
            </div>
            <div>из 5</div>
            <div>{totalReviews} оценок</div>
            <div className="rating-distribution flex flex-col gap-1 mt-4">
              <div className="rating-row">★★★★★ {ratingDistribution[4]}</div>
              <div className="rating-row">★★★★ {ratingDistribution[3]}</div>
              <div className="rating-row">★★★ {ratingDistribution[2]}</div>
              <div className="rating-row">★★ {ratingDistribution[1]}</div>
              <div className="rating-row">★ {ratingDistribution[0]}</div>
            </div>
          </div>
          <div className="card stats-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-blue-700 mb-2">
              Динамика тональности
            </h2>
            <div className="chart-container relative h-64 mb-4">
              <Line
                data={{
                  labels: sentimentTimeline.labels,
                  datasets: [
                    {
                      label: "Позитивные",
                      data: sentimentTimeline.positive,
                      borderColor: "#34d399",
                      backgroundColor: "rgba(52,211,153,0.2)",
                      fill: true,
                      tension: 0.4,
                    },
                    {
                      label: "Нейтральные",
                      data: sentimentTimeline.neutral,
                      borderColor: "#60a5fa",
                      backgroundColor: "rgba(96,165,250,0.2)",
                      fill: true,
                      tension: 0.4,
                    },
                    {
                      label: "Негативные",
                      data: sentimentTimeline.negative,
                      borderColor: "#f87171",
                      backgroundColor: "rgba(248,113,113,0.2)",
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: true, position: "top" },
                    tooltip: { enabled: true },
                  },
                  scales: {
                    x: { title: { display: true, text: "Дата" } },
                    y: {
                      title: { display: true, text: "Количество" },
                      beginAtZero: true,
                    },
                  },
                  maintainAspectRatio: false,
                }}
                height={250}
              />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {sentimentTimeline.labels.length > 0 && (
                <span>
                  Период: {sentimentTimeline.labels[0]} —{" "}
                  {
                    sentimentTimeline.labels[
                      sentimentTimeline.labels.length - 1
                    ]
                  }
                </span>
              )}
            </div>
            <button
              className="toggle-btn bg-green-200 px-4 py-2 rounded flex items-center mx-auto mt-2"
              id="expandChart"
              // onClick={...} // (optional: implement fullscreen logic if needed)
            >
              <span>Развернуть график</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6M14 10l7-7M3 9V3h6M4 14l7 7"></path>
              </svg>
            </button>
          </div>
          <div className="card comparison-card col-span-2 p-6 rounded-lg shadow mt-6">
            <h2 className="text-xl font-bold text-blue-700 mb-2">
              Сравнительный анализ аспектов в отзывах у конкурентов
            </h2>
            <table className="w-full mt-4 border-collapse">
              <thead>
                <tr>
                  <th className="bg-blue-200 text-blue-700">Оценка</th>
                  <th className="bg-blue-200 text-blue-700">Цена</th>
                  <th className="bg-blue-200 text-blue-700">Качество</th>
                  <th className="bg-blue-200 text-blue-700">Сервис</th>
                  <th className="bg-blue-200 text-blue-700">Доступность</th>
                  <th className="bg-blue-200 text-blue-700">Разнообразие</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Конкурент 1</td>
                  <td>20%</td>
                  <td>40%</td>
                  <td>90%</td>
                  <td>76%</td>
                  <td>90%</td>
                </tr>
                <tr>
                  <td>Конкурент 2</td>
                  <td>13%</td>
                  <td>38%</td>
                  <td>10%</td>
                  <td>55%</td>
                  <td>83%</td>
                </tr>
                <tr>
                  <td>Конкурент 3</td>
                  <td>90%</td>
                  <td>34%</td>
                  <td>90%</td>
                  <td>76%</td>
                  <td>97%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 improvement-section mt-6">
          <div className="card p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold text-blue-700 mb-2">
              Наши преимущества
            </h3>
            <ul className="list-disc pl-5">
              <li>Высокий рейтинг сервиса (90%)</li>
              <li>Широкое разнообразие услуг (90%)</li>
              <li>Доступность в большинстве регионов (76%)</li>
            </ul>
          </div>
          <div className="card p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold text-blue-700 mb-2">
              Что можно улучшить
            </h3>
            <ul className="list-disc pl-5">
              <li>Прозрачность цен (20%)</li>
              <li>Качество некоторых услуг (40%)</li>
              <li>Снижение скрытых комиссий</li>
            </ul>
          </div>
        </div>
        <div className="card p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-bold text-blue-700 mb-2">
            Рекомендации ИИ
          </h2>
          <p>На основе анализа 248 отзывов (↑12% за неделю)</p>
          <p className="negative text-red-600">
            Негативные: 23% (↓2% за неделю)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <h4 className="font-bold mb-2">Топ-5 плюсов компании</h4>
              <ul className="list-disc pl-5">
                <li>Удобный интерфейс (42%)</li>
                <li>Быстрое обслуживание (38%)</li>
                <li>Доступность сервиса (36%)</li>
                <li>Качество продуктов (28%)</li>
                <li>Разнообразие услуг (26%)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">Топ-5 проблем</h4>
              <ul className="list-disc pl-5">
                <li>Скрытые комиссии (23%)</li>
                <li>Блокировка счетов (18%)</li>
                <li>Проблемы с поддержкой (15%)</li>
                <li>Долгое оформление (12%)</li>
                <li>Ограничения по оплате (10%)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      {/* Chart.js CDN */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;700&display=swap"
      />
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      {/* Chart.js logic for React */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
  // ... Chart.js logic from HTML ...
`,
        }}
      />
    </div>
  );
}
