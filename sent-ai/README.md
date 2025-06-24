# Sentiment AI

Многофункциональная система анализа отзывов с использованием ИИ, визуализацией метрик и генерацией рекомендаций для бизнеса.

## Возможности
- Загрузка и обработка отзывов
- Анализ тональности, категорий, тегов и приоритетов
- Визуализация метрик (графики, распределения, сравнительный анализ)
- Генерация AI-рекомендаций и шаблонов ответов через HuggingFace
- Сравнение с конкурентами, отдельные рекомендации по категориям
- Современный UI на React + Tailwind + Chart.js
- Аутентификация пользователей

## Технологии
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Chart.js
- **Backend:** Node.js, Express, TypeScript
- **БД:** PostgreSQL (через Prisma ORM)
- **AI:** HuggingFace API (text2text-generation, zero-shot-classification)

## Быстрый старт

### 1. Клонирование и установка зависимостей
```sh
git clone <your-repo-url>
cd sent-ai
pnpm install
cd backend && pnpm install
cd ../webapp && pnpm install
```

### 2. Настройка переменных окружения
Создайте файл `.env` в папке `backend`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/sentiment-ai-db
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

### 3. Миграции Prisma
```sh
cd backend
pnpm prisma migrate dev
```

### 4. Запуск backend
```sh
pnpm dev
```

### 5. Запуск frontend
```sh
cd ../webapp
pnpm dev
```

## Структура проекта
- `backend/` — сервер, Prisma, логика анализа, API
- `webapp/` — клиентская часть (React)
- `parser/` — парсер отзывов (опционально)


## Контакты и поддержка
- Вопросы и предложения: issues или pull requests

---

_Проект для анализа и улучшения клиентского опыта с помощью ИИ._
