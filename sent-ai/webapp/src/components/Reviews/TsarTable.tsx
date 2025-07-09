import { useEffect, useState } from "react";
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

const TsarTable = () => {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<ProcessedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editCol, setEditCol] = useState<string | null>(null); // выбранная колонка
  const [editRows, setEditRows] = useState<Set<number>>(new Set()); // id выделенных строк

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
      } catch (e) {
        // ignore
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchProcessedReviews = async () => {
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
          setError("Ошибка при загрузке отзывов");
        }
      } catch (e) {
        setError("Ошибка при загрузке отзывов");
      } finally {
        setLoading(false);
      }
    };
    fetchProcessedReviews();
  }, []);

  // Очистка выбранной колонки в выделенных строках
  const handleClear = () => {
    if (!editCol || editRows.size === 0) return;
    setReviews((prev) =>
      prev.map((r) => {
        if (!editRows.has(r.id)) return r;
        switch (editCol) {
          case "sentiment":
          case "theme":
          case "category":
          case "priority":
          case "competitorMention":
          case "text":
            return { ...r, [editCol]: "" };
          case "tags":
            return { ...r, tags: [] };
          case "rating":
            return { ...r, rating: 0 };
          default:
            return r;
        }
      })
    );
  };

  // Вставка из Excel
  const handlePaste = (e: React.ClipboardEvent<HTMLTableSectionElement>) => {
    if (!editCol || editRows.size === 0) return;
    const clipboard = e.clipboardData.getData("text/plain");
    if (!clipboard) return;
    const lines = clipboard.split(/\r?\n/).filter(Boolean);
    const selectedIds = Array.from(editRows);
    setReviews((prev) => {
      const newReviews = [...prev];
      let rowIdx = 0;
      for (let i = 0; i < newReviews.length && rowIdx < lines.length; i++) {
        if (selectedIds.includes(newReviews[i].id)) {
          // @ts-ignore
          newReviews[i][editCol] =
            editCol === "tags"
              ? lines[rowIdx]
                  .split(/,|;/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : lines[rowIdx];
          rowIdx++;
        }
      }
      return newReviews;
    });
    e.preventDefault();
  };

  // Сохранение изменений на сервер
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(
        "http://localhost:3000/api/reviews/processed/bulk-update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reviews }),
        }
      );
      if (response.ok) {
        alert("Изменения успешно сохранены!");
      } else {
        alert("Ошибка при сохранении изменений");
      }
    } catch (e) {
      alert("Ошибка при сохранении изменений");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || user.role !== "tsar") {
    return (
      <div className="text-center text-red-500 mt-10">Доступ запрещён</div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
            Таблица всех обработанных отзывов
          </h1>
        </div>
      </header>
      <div className="flex flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
        />
        <div className="flex-1 overflow-x-auto p-8">
          <div className="mb-4 text-sm text-gray-500">
            <b>Инструкция:</b> 1) Выделите строки (чекбоксы слева), 2) кликните
            по заголовку нужной колонки, 3) используйте кнопку "Очистить" или
            вставьте значения из Excel (Ctrl+V/Cmd+V).
            <br />
            <span className="text-xs">
              Поддерживается только одна колонка за раз.
            </span>
          </div>
          <div className="mb-2 flex gap-2 items-center">
            <button
              className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-50"
              disabled={!editCol || editRows.size === 0}
              onClick={handleClear}
            >
              Очистить выбранные
            </button>
            <button
              className="px-3 py-1 bg-green-600 text-white rounded"
              onClick={handleSave}
            >
              Сохранить
            </button>
            {editCol && (
              <span className="text-xs text-gray-600">
                Колонка: <b>{editCol}</b>
              </span>
            )}
          </div>
          <table className="min-w-full border text-xs">
            <thead>
              <tr className="bg-blue-50">
                <th className="border px-2 py-1"></th>
                <th className="border px-2 py-1">ID</th>
                <th className="border px-2 py-1">Дата</th>
                <th className="border px-2 py-1">Время</th>
                <th
                  className={`border px-2 py-1 cursor-pointer ${
                    editCol === "rating" ? "bg-yellow-100" : ""
                  }`}
                  onClick={() => setEditCol("rating")}
                >
                  Оценка
                </th>
                <th
                  className={`border px-2 py-1 cursor-pointer ${
                    editCol === "sentiment" ? "bg-yellow-100" : ""
                  }`}
                  onClick={() => setEditCol("sentiment")}
                >
                  Тональность
                </th>
                <th
                  className={`border px-2 py-1 cursor-pointer ${
                    editCol === "theme" ? "bg-yellow-100" : ""
                  }`}
                  onClick={() => setEditCol("theme")}
                >
                  Тема
                </th>
                <th
                  className={`border px-2 py-1 cursor-pointer ${
                    editCol === "category" ? "bg-yellow-100" : ""
                  }`}
                  onClick={() => setEditCol("category")}
                >
                  Категория
                </th>
                <th
                  className={`border px-2 py-1 cursor-pointer ${
                    editCol === "priority" ? "bg-yellow-100" : ""
                  }`}
                  onClick={() => setEditCol("priority")}
                >
                  Приоритет
                </th>
                <th
                  className={`border px-2 py-1 cursor-pointer ${
                    editCol === "competitorMention" ? "bg-yellow-100" : ""
                  }`}
                  onClick={() => setEditCol("competitorMention")}
                >
                  Конкурент
                </th>
                <th
                  className={`border px-2 py-1 cursor-pointer ${
                    editCol === "tags" ? "bg-yellow-100" : ""
                  }`}
                  onClick={() => setEditCol("tags")}
                >
                  Метки
                </th>
                <th className="border px-2 py-1">Текст</th>
              </tr>
            </thead>
            <tbody onPaste={handlePaste}>
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-yellow-50">
                  <td className="border px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={editRows.has(r.id)}
                      onChange={(e) => {
                        setEditRows((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(r.id);
                          else next.delete(r.id);
                          return next;
                        });
                      }}
                    />
                  </td>
                  <td className="border px-2 py-1 font-mono">{r.id}</td>
                  <td className="border px-2 py-1">{r.date}</td>
                  <td className="border px-2 py-1">{r.collectionTime}</td>
                  <td className="border px-2 py-1 text-center">{r.rating}</td>
                  <td className="border px-2 py-1">{r.sentiment || "—"}</td>
                  <td className="border px-2 py-1">{r.theme || "—"}</td>
                  <td className="border px-2 py-1">{r.category || "—"}</td>
                  <td className="border px-2 py-1">{r.priority || "—"}</td>
                  <td className="border px-2 py-1">
                    {r.competitorMention || "—"}
                  </td>
                  <td className="border px-2 py-1">
                    {r.tags && r.tags.length > 0 ? r.tags.join(", ") : "—"}
                  </td>
                  <td
                    className="border px-2 py-1 max-w-xs truncate"
                    title={r.text}
                  >
                    {r.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default TsarTable;
