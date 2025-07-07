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
  const [isChartExpanded, setIsChartExpanded] = useState(false);

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
  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
    });
    return dist;
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

      <main className="container mx-auto pt-8 px-4">
        {" "}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="metric-value text-2xl font-bold mb-2">
            Всего отзывов: {totalReviews}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 metrics-grid items-stretch">
            <div className="metric-card p-1 rounded-lg shadow bg-gradient-to-r from-blue-200 to-green-200 flex flex-col items-center min-h-[40px] w-full justify-center">
              <div className="metric-header text-gray-500 text-xs">
                Личный кабинет
              </div>
              <div className="metric-value text-blue-700 text-base font-bold">
                91%
              </div>
              <div className="metric-change positive flex items-center text-green-600 text-xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#4CAF50">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
                <span className="ml-1">172</span>
              </div>
            </div>
            <div className="metric-card p-1 rounded-lg shadow bg-gradient-to-r from-blue-200 to-green-200 flex flex-col items-center min-h-[40px] w-full justify-center">
              <div className="metric-header text-gray-500 text-xs">Карта</div>
              <div className="metric-value text-blue-700 text-base font-bold">
                83%
              </div>
              <div className="metric-change positive flex items-center text-green-600 text-xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#4CAF50">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
                <span className="ml-1">124</span>
              </div>
            </div>
            <div className="metric-card p-1 rounded-lg shadow bg-gradient-to-r from-blue-200 to-green-200 flex flex-col items-center min-h-[40px] w-full justify-center">
              <div className="metric-header text-gray-500 text-xs">
                Обслуживание
              </div>
              <div className="metric-value text-blue-700 text-base font-bold">
                62%
              </div>
              <div className="metric-change positive flex items-center text-green-600 text-xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#4CAF50">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
                <span className="ml-1">97</span>
              </div>
            </div>
            <div className="metric-card p-1 rounded-lg shadow bg-gradient-to-r from-blue-200 to-green-200 flex flex-col items-center min-h-[40px] w-full justify-center">
              <div className="metric-header text-gray-500 text-xs">
                Надёжность
              </div>
              <div className="metric-value text-blue-700 text-base font-bold">
                56%
              </div>
              <div className="metric-change positive flex items-center text-green-600 text-xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#4CAF50">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
                <span className="ml-1">88</span>
              </div>
            </div>
            <div className="metric-card p-1 rounded-lg shadow bg-gradient-to-r from-blue-200 to-green-200 flex flex-row items-center justify-between min-h-[40px] w-full">
              {/* Левая часть: оценка из 5 */}
              <div className="flex flex-col items-center justify-center min-w-[40px]">
                <div className="text-2xl font-bold mb-1">
                  {averageRating.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">из 5</div>
                <div className="text-xs text-gray-500 mt-1">
                  {totalReviews} оценок
                </div>
              </div>
              <div className="flex flex-col ml-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center">
                    <span className="text-yellow-400">
                      {Array.from({ length: star }).map((_, i) => (
                        <svg
                          key={i}
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="inline-block align-middle"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </span>
                    <span className="text-xs text-gray-700 ml-1">
                      {ratingDistribution[star - 1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Новый layout: 3 колонки, но с col-span для ширины */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-2">
          {/* Карточки преимуществ и улучшений - col-span-2 */}
          <div className="md:col-span-2 flex flex-row gap-4 bg-gradient-to-r from-blue-100 via-cyan-100 to-green-100 rounded-2xl p-6">
            {/* Наши преимущества */}
            <div className="flex-1 bg-white/60 rounded-2xl shadow flex flex-col items-center p-4 min-h-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-blue-200">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4F8EF9"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12l2.5 2.5L16 9" />
                  </svg>
                </span>
                <span className="font-semibold text-blue-700 text-base">
                  наши преимущества
                </span>
              </div>
              <ul className="list-none text-gray-700 text-sm w-full mt-2">
                <li className="mb-1">Высокий рейтинг сервиса (90%)</li>
                <li className="mb-1">Широкое разнообразие услуг (90%)</li>
                <li>Доступность в большинстве регионов (76%)</li>
              </ul>
            </div>
            {/* Что можно улучшить */}
            <div className="flex-1 bg-white/60 rounded-2xl shadow flex flex-col items-center p-4 min-h-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-blue-200">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4F8EF9"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.5 6.5l-7.8 7.8a2.5 2.5 0 003.5 3.5l6.3-6.3a4 4 0 00-5.7-5.7l-8.5 8.5a6 6 0 008.5 8.5l7.1-7.1" />
                  </svg>
                </span>
                <span className="font-semibold text-blue-700 text-base">
                  что можно улучшить
                </span>
              </div>
              <ul className="list-none text-gray-700 text-sm w-full mt-2">
                <li className="mb-1">Прозрачность цен (20%)</li>
                <li className="mb-1">Качество некоторых услуг (40%)</li>
                <li>Снижение скрытых комиссий</li>
              </ul>
            </div>
          </div>
          {/* Динамика тональности — col-span-2, справа от карточки */}
          <div className="card stats-card p-6 rounded-lg shadow relative md:col-span-2">
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
              onClick={() => setIsChartExpanded(true)}
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
            {/* Expanded Chart Modal */}
            {isChartExpanded && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-5xl relative flex flex-col">
                  <button
                    className="absolute top-4 right-4 px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-900 transition-colors"
                    onClick={() => setIsChartExpanded(false)}
                  >
                    Свернуть
                  </button>
                  <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">
                    Динамика тональности
                  </h2>
                  <div className="h-[60vh] w-full">
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
                      height={400}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
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
                </div>
              </div>
            )}
          </div>
          {/* Сравнительный анализ конкурентов - col-span-4, ниже */}
          <div className="card comparison-card p-4 rounded-lg shadow flex flex-col justify-between md:col-span-4">
            <h2 className="text-lg font-bold text-blue-700 mb-2">
              Сравнительный анализ аспектов в отзывах у конкурентов
            </h2>
            <table className="w-full mt-2 border-collapse text-xs items-center">
              <thead>
                <tr>
                  <th className="bg-blue-200 text-blue-700 text-center">
                    Оценка
                  </th>
                  <th className="bg-blue-200 text-blue-700 text-center">
                    Цена
                  </th>
                  <th className="bg-blue-200 text-blue-700 text-center">
                    Качество
                  </th>
                  <th className="bg-blue-200 text-blue-700 text-center">
                    Сервис
                  </th>
                  <th className="bg-blue-200 text-blue-700 text-center">
                    Доступность
                  </th>
                  <th className="bg-blue-200 text-blue-700 text-center">
                    Разнообразие
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center">Конкурент 1</td>
                  <td className="text-center">20%</td>
                  <td className="text-center">40%</td>
                  <td className="text-center">90%</td>
                  <td className="text-center">76%</td>
                  <td className="text-center">90%</td>
                </tr>
                <tr>
                  <td className="text-center">Конкурент 2</td>
                  <td className="text-center">13%</td>
                  <td className="text-center">38%</td>
                  <td className="text-center">10%</td>
                  <td className="text-center">55%</td>
                  <td className="text-center">83%</td>
                </tr>
                <tr>
                  <td className="text-center">Конкурент 3</td>
                  <td className="text-center">90%</td>
                  <td className="text-center">34%</td>
                  <td className="text-center">90%</td>
                  <td className="text-center">76%</td>
                  <td className="text-center">97%</td>
                </tr>
              </tbody>
            </table>
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
