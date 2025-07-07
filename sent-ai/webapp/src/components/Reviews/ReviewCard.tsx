import { useState, useEffect, useMemo } from "react";
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
  const [searchId, setSearchId] = useState("");
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // --- Фильтрация ---
  const [filter, setFilter] = useState({
    priority: "",
    rating: "",
    dateFrom: "",
    dateTo: "",
    sentiment: "",
    competitorMention: "",
    theme: "",
    category: "",
    tag: "",
  });

  const themeOptions = [
    "Удобный личный кабинет",
    "Невозможность войти в ЛК",
    "Ошибки при регистрации",
    "Проблемы с восстановлением пароля",
    "Некорректное отображение данных пользователя",
    "Проблемы с доступом к функциям ЛК",
    "Высокое/отличное качество обслуживания",
    "Долгое ожидание ответа от службы поддержки",
    "Некомпетентность сотрудников",
    "Грубое обращение",
    "Невыполнение обещаний менеджеров",
    "Отсутствие индивидуального подхода",
    "Неоперативное решение проблем",
    "Игнорирование обращений клиентов",
    "Шаблонные, нерелевантные ответы",
    "Выгодная цена",
    "Выгодный тариф",
    "Неожиданное повышение тарифов",
    "Скрытые комиссии",
    "Несоответствие заявленным ценам",
    "Сложность тарифной сетки (непонятные условия)",
    "Отсутствие уведомлений об изменении тарифов",
    "Динамическое ценообразование (наценки на топливо)",
    "Отсутствие скидок, несмотря на обещания",
    "Профессиональная работа менеджера",
    "Менеджер не отвечает на запросы",
    "Ошибки в консультациях",
    "Навязывание ненужных услуг",
    "Несвоевременное информирование об изменениях",
    "Отсутствие обратной связи после обращения",
    "Менеджер в отпуске или недоступен",
    "Пропадание менеджера после обещаний",
    "Непрофессиональное поведение",
    "Удобное использование карт",
    "Блокировка карты без предупреждения",
    "Ошибки при списании средств",
    "Проблемы с активацией карты",
    "Ограничение функционала карты",
    "Утеря/кража карты",
    "Непринятие карты на АЗС",
    "Проблемы с разблокировкой карты",
    "Точная отчётность",
    "Своевременная отчётность",
    "Задержки в предоставлении отчетов",
    "Ошибки в документах",
    "Потеря документов",
    "Сложность получения справок",
    "Неудобный формат отчетности",
    "Некорректные закрывающие документы",
    "Отсутствие документов в срок",
    "Проблемы с электронным документооборотом",
    "Выгодные условия договора",
    "Непрозрачные условия договора",
    "Сложность расторжения договора",
    "Изменение условий без уведомления",
    "Ошибки в реквизитах договора",
    "Отказ в пересмотре условий",
    "Самовольное подключение платных услуг",
    "Несоответствие условий договора обещаниям менеджеров",
    "Самовольное изменение условий договора",
    "Надёжная компания",
    "Задержки выплат",
    "Отсутствие резервных систем",
    "Нестабильность работы в кризисных ситуациях",
    "Подозрения в мошенничестве",
    "Проблемы с покрытием АЗС в регионах",
    "Отсутствие уведомлений о критических изменениях",
    "Некачественное оказание услуг",
    "Отказ в предоставлении заявленной услуги",
    "Навязывание ненужных опций",
    "Переплата за услуги",
    "Ограниченное покрытие услуг в регионах",
    "Проблемы с подключением новых услуг",
    "Оперативная работа поддержки",
    "Долгое ожидание ответа",
    "Шаблонные, нерелевантные ответы",
    "Недоступность горячей линии",
    "Игнорирование обращений",
    "Неэффективность чат-бота",
    "Транзакции без трудностей",
    "Ошибочное списание средств",
    "Задержка поступлений",
    "Отказ в проведении операции",
    "Несанкционированные транзакции",
    "Проблемы с возвратом средств",
    "Скрытые комиссии",
    "Удобный и понятный интерфейс",
    "Ошибки в работе приложения",
    "Медленная загрузка страниц",
    "Неудобный интерфейс",
    "Отсутствие нужных функций",
    "Проблемы с обновлениями",
    "Зависание системы",
    "Некорректная работа мобильного приложения",
    "Неудобный интерфейс выбора периода транзакций",
    "Неактуальная информация о балансе и транзакциях",
    "Задержки в обновлении информации",
    "Технические сбои в работе сервисов",
    "Отзыв без деталей",
  ];
  const categoryOptions = [
    "Личный кабинет",
    "Качество обслуживания",
    "Цены и тарифы",
    "Работа менеджеров",
    "Карта (топливная от компании ППР)",
    "Документооборот / отчетность",
    "Договор",
    "Надежность компании",
    "Дополнительные услуги",
    "Поддержка",
    "Финансовые операции",
    "Функционал сайта/приложения",
    "Недетализированный отзыв",
  ];
  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    reviews.forEach((r) => (r.tags || []).forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [reviews]);
  const filteredReviews = useMemo(() => {
    let filtered = reviews.filter((r) => {
      if (filter.priority && r.priority !== filter.priority) return false;
      if (filter.rating && r.rating !== Number(filter.rating)) return false;
      if (filter.dateFrom && new Date(r.date) < new Date(filter.dateFrom))
        return false;
      if (filter.dateTo && new Date(r.date) > new Date(filter.dateTo))
        return false;
      if (filter.sentiment && r.sentiment !== filter.sentiment) return false;
      if (
        filter.competitorMention &&
        r.competitorMention !== filter.competitorMention
      )
        return false;
      if (filter.theme && r.theme !== filter.theme) return false;
      if (filter.category && r.category !== filter.category) return false;
      if (filter.tag && !(r.tags || []).includes(filter.tag)) return false;
      return true;
    });
    // Если есть поиск по ID и найденный отзыв, перемещаем его наверх
    if (highlightedId) {
      const idx = filtered.findIndex((r) => r.id === highlightedId);
      if (idx > 0) {
        const [found] = filtered.splice(idx, 1);
        filtered.unshift(found);
      }
    }
    return filtered;
  }, [reviews, filter, highlightedId]);

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header с кнопкой меню */}
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
        {/* Поиск по ID */}
        <div className="flex items-center gap-2 ml-4">
          <input
            type="number"
            min="1"
            placeholder="Поиск по ID отзыва..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ width: 180 }}
          />
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {
              const id = Number(searchId);
              if (!id) return setHighlightedId(null);
              const found = reviews.find((r) => r.id === id);
              setHighlightedId(found ? id : null);
            }}
          >
            Найти
          </button>
          {highlightedId && (
            <button
              className="ml-2 px-2 py-1 text-xs text-gray-500 border border-gray-300 rounded hover:bg-gray-100"
              onClick={() => {
                setHighlightedId(null);
                setSearchId("");
              }}
            >
              Сбросить
            </button>
          )}
        </div>
      </header>
      <div className="flex flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
        />
        {/* Основной контент */}
        <div className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-6 max-w-4xl mx-auto">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className={`w-full rounded-lg p-6 border ${getSentimentColor(
                    review.sentiment
                  )} shadow-sm hover:shadow-md transition-shadow duration-200${
                    highlightedId === review.id
                      ? " bg-yellow-100 !border-2 !border-yellow-400"
                      : ""
                  }`}
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
                        <span className="font-medium text-gray-700">
                          Оценка:
                        </span>
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
                          <h3 className="text-gray-700 font-medium mb-2">
                            Тема:
                          </h3>
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
                          <p className="text-gray-600">
                            {review.category || "—"}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-gray-700 font-medium mb-2">
                            Приоритет:
                          </h3>
                          <p className="text-gray-600">
                            {review.priority || "—"}
                          </p>
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
                          <h3 className="text-gray-700 font-medium mb-2">
                            Метки:
                          </h3>
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
              {filteredReviews.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  Нет обработанных отзывов
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Блок фильтра справа */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto hidden lg:block ml-2">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-blue-700 text-center">
              Фильтр
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Приоритет
                </label>
                <select
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
                  value={filter.priority}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, priority: e.target.value }))
                  }
                >
                  <option value="">Все</option>
                  <option value="Очень важный">Очень важный</option>
                  <option value="Важный">Важный</option>
                  <option value="Обычный">Обычный</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Рейтинг
                </label>
                <select
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
                  value={filter.rating}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, rating: e.target.value }))
                  }
                >
                  <option value="">Все</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} звёзд
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Дата (с)
                </label>
                <input
                  type="date"
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
                  value={filter.dateFrom}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, dateFrom: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Дата (по)
                </label>
                <input
                  type="date"
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
                  value={filter.dateTo}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, dateTo: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Тональность
                </label>
                <select
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
                  value={filter.sentiment}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, sentiment: e.target.value }))
                  }
                >
                  <option value="">Все</option>
                  <option value="Позитивный">Положительные</option>
                  <option value="Негативный">Негативные</option>
                  <option value="Нейтральный">Нейтральные</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Упоминание о конкурентах
                </label>
                <select
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
                  value={filter.competitorMention}
                  onChange={(e) =>
                    setFilter((f) => ({
                      ...f,
                      competitorMention: e.target.value,
                    }))
                  }
                >
                  <option value="">Все</option>
                  <option value="TRUE">Есть</option>
                  <option value="FALSE">Нет</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Тема</label>
                <select
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
                  value={filter.theme}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, theme: e.target.value }))
                  }
                >
                  <option value="">Все</option>
                  {themeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Категория
                </label>
                <select
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
                  value={filter.category}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  <option value="">Все</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Тег</label>
                <select
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
                  value={filter.tag}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, tag: e.target.value }))
                  }
                >
                  <option value="">Все</option>
                  {tagOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded p-2 mt-2 font-semibold transition-colors"
                onClick={() =>
                  setFilter({
                    priority: "",
                    rating: "",
                    dateFrom: "",
                    dateTo: "",
                    sentiment: "",
                    competitorMention: "",
                    theme: "",
                    category: "",
                    tag: "",
                  })
                }
              >
                Сбросить фильтр
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
