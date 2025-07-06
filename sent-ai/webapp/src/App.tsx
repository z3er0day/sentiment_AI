import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import { RegistrationModal } from "./components/RegistrationModal";
import { LoginModal } from "./components/LoginModal";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { ReviewsPage } from "./components/Reviews/ReviewsPage";
import { ProcessedReviews } from "./components/Reviews/ProcessedReviews";
import ReviewCard from "./components/Reviews/ReviewCard";
import CompetitorAnylize from "./components/Reviews/CompetitorAnylize";
import AIrecommendations from "./components/Reviews/AIrecommendations";

function Home() {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleRegister = async (data: {
    fullName: string;
    organization: string;
  }) => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem("token", result.token);
        setIsLoggedIn(true);
        setIsRegistrationOpen(false);
      } else {
        alert("Ошибка при регистрации");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Ошибка при регистрации");
    }
  };

  const handleLogin = async (data: {
    fullName: string;
    organization: string;
  }) => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem("token", result.token);
        setIsLoggedIn(true);
        setIsLoginOpen(false);
      } else {
        alert("Неверные учетные данные");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Ошибка при входе");
    }
  };

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow flex items-center justify-between py-4 px-6 z-30">
        <h1 className="text-2xl font-bold text-blue-700">sentiment-ai</h1>
        <div className="space-x-4">
          <button
            onClick={() => setIsLoginOpen(true)}
            className="px-4 py-2 border border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white rounded transition-colors duration-200"
          >
            Войти
          </button>
          <button
            onClick={() => setIsRegistrationOpen(true)}
            className="px-4 py-2 border border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white rounded transition-colors duration-200"
          >
            Регистрация
          </button>
        </div>
      </header>

      <main className="pt-32 container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-blue-700 mb-4 drop-shadow">
            Анализ отзывов
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Используйте силу искусственного интеллекта для анализа отзывов
            компании
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gradient-to-r from-blue-200 to-green-200 rounded-lg shadow p-6 flex flex-col items-center">
            <h3 className="text-xl font-bold text-blue-700 mb-2">
              Быстрый старт
            </h3>
            <p className="text-gray-700 text-center">
              Зарегистрируйтесь и загрузите отзывы — получите аналитику за
              минуты.
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-200 to-green-200 rounded-lg shadow p-6 flex flex-col items-center">
            <h3 className="text-xl font-bold text-blue-700 mb-2">AI-анализ</h3>
            <p className="text-gray-700 text-center">
              Современные модели выявляют тональность, проблемы и сильные
              стороны компании.
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-200 to-green-200 rounded-lg shadow p-6 flex flex-col items-center">
            <h3 className="text-xl font-bold text-blue-700 mb-2">
              Визуализация
            </h3>
            <p className="text-gray-700 text-center">
              Наглядные графики и рекомендации для принятия решений.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-bold text-blue-700 mb-2">
              Наши преимущества
            </h4>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Высокая точность анализа</li>
              <li>Интуитивный интерфейс</li>
              <li>Безопасность данных</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-bold text-blue-700 mb-2">
              Что вы получите
            </h4>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Детальную аналитику отзывов</li>
              <li>Рекомендации по улучшению</li>
              <li>Сравнение с конкурентами</li>
            </ul>
          </div>
        </div>
      </main>

      <RegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        onRegister={handleRegister}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/processed-reviews" element={<ProcessedReviews />} />
        <Route path="/reviews/cards" element={<ReviewCard />} />
        <Route path="/competitor-analysis" element={<CompetitorAnylize />} />
        <Route path="/ai-recommendations" element={<AIrecommendations />} />
      </Routes>
    </Router>
  );
}

export default App;
