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
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">sentiment-ai</h1>
          <div className="space-x-4">
            <button
              onClick={() => setIsLoginOpen(true)}
              className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors duration-200"
            >
              Войти
            </button>
            <button
              onClick={() => setIsRegistrationOpen(true)}
              className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors duration-200"
            >
              Регистрация
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-black mb-4">
              Анализ отзывов
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Используйте силу искусственного интеллекта для анализа отзывов
              компании
            </p>
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
