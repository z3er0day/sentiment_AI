import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import {
  analyzeTheme,
  analyzeCategory,
  analyzeTags,
  analyzeSentiment,
  analyzePriority,
  analyzeCompetitorMention,
} from "../lib/g4fThemeAnalyzer";
import { generateTextRecommendation } from "../lib/textRecommendation";

const router = express.Router();
const prisma = new PrismaClient();

// Константы
const BATCH_SIZE = 100; // Размер пакета для обработки

// JWT middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Требуется авторизация" });
    return;
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    next();
  } catch {
    res.status(403).json({ error: "Недействительный токен" });
  }
};

// Только tsar
const isTsar = (req: any, res: any, next: any) => {
  if (req.user.role !== "tsar") {
    res.status(403).json({ error: "Доступ запрещен" });
    return;
  }
  next();
};

// Получить все отзывы
router.get("/", authenticateToken, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: { user: true },
      orderBy: { id: "asc" },
    });
    res.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Ошибка при получении отзывов" });
  }
});

// Получить обработанные отзывы (теперь из ProcessedReview)
router.get("/processed", authenticateToken, async (req, res) => {
  try {
    const processed = await prisma.processedReview.findMany({
      include: {
        review: {
          include: { user: true },
        },
      },
      orderBy: { id: "asc" },
    });
    // Преобразуем для фронта: объединяем данные из ProcessedReview и Review
    const result = processed.map((p) => ({
      id: p.id,
      text: p.review.text,
      rating: p.review.rating,
      date: p.review.date,
      collectionTime: p.review.collectionTime,
      theme: p.theme,
      sentiment: p.sentiment,
      category: p.category,
      priority: p.priority,
      competitorMention: p.competitorMention,
      tags: p.tags ? p.tags.split(",").map((t) => t.trim()) : null,
      user: p.review.user
        ? {
            fullName: p.review.user.fullName,
            organization: p.review.user.organization,
          }
        : undefined,
    }));
    res.json({ reviews: result });
  } catch (error) {
    console.error("Error fetching processed reviews:", error);
    res
      .status(500)
      .json({ error: "Ошибка при получении обработанных отзывов" });
  }
});

// Функция для обработки пакета отзывов
const processBatch = async (batch: any[], userId: number) => {
  return await prisma.$transaction(
    batch.map((review) => {
      // Проверяем и преобразуем данные
      const text = String(review.text || "").trim();
      const rating = Number(review.rating);
      let date = new Date(review.date);
      let collectionTime = new Date(review.collectionTime);

      // Валидация данных
      if (!text) {
        throw new Error("Текст отзыва не может быть пустым");
      }
      if (isNaN(rating) || rating < 0 || rating > 5) {
        throw new Error("Некорректное значение рейтинга");
      }
      if (isNaN(date.getTime())) {
        date = new Date();
      }
      if (isNaN(collectionTime.getTime())) {
        collectionTime = new Date();
      }

      return prisma.review.create({
        data: {
          text,
          rating,
          date,
          collectionTime,
          userId,
        },
      });
    })
  );
};

// Массовое добавление отзывов
router.post("/bulk", authenticateToken, isTsar, async (req: any, res) => {
  const { reviews } = req.body;

  if (!Array.isArray(reviews)) {
    res.status(400).json({ error: "Неверный формат данных" });
    return;
  }

  if (reviews.length === 0) {
    res.status(400).json({ error: "Нет данных для сохранения" });
    return;
  }

  try {
    let processedCount = 0;
    const errors = [];

    // Обрабатываем данные пакетами
    for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
      const batch = reviews.slice(i, i + BATCH_SIZE);
      try {
        const created = await processBatch(batch, req.user.id);
        processedCount += created.length;
      } catch (error: any) {
        console.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, error);
        errors.push(
          `Ошибка в пакете ${i / BATCH_SIZE + 1}: ${
            error.message || "Неизвестная ошибка"
          }`
        );
      }
    }

    if (processedCount === 0) {
      res.status(500).json({
        error: "Не удалось сохранить отзывы",
        details: errors,
      });
      return;
    }

    res.json({
      message: "Отзывы обработаны",
      success: processedCount,
      total: reviews.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error saving reviews:", error);
    res.status(500).json({
      error: "Ошибка при сохранении отзывов",
      details: error.message || "Неизвестная ошибка",
    });
  }
});

// Анализировать тему отзыва через g4f
router.post("/analyze-theme", authenticateToken, isTsar, async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Не передан текст отзыва" });
    return;
  }
  try {
    const theme = await analyzeTheme(text);
    res.json({ theme });
  } catch (error: any) {
    console.error("Ошибка анализа темы:", error);
    res.status(500).json({
      error: "Ошибка анализа темы",
      details: error && error.message ? error.message : String(error),
      stack: error?.stack,
    });
  }
});

// Массовый анализ всех отзывов и сохранение в ProcessedReview
router.post("/analyze-all", authenticateToken, isTsar, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany();
    let processedCount = 0;
    for (const review of reviews) {
      try {
        // Проверяем, не обработан ли уже этот отзыв
        const exists = await prisma.processedReview.findUnique({
          where: { reviewId: review.id },
        });
        if (exists) continue;
        // Анализируем тему
        const theme = await analyzeTheme(review.text);
        await prisma.processedReview.create({
          data: {
            reviewId: review.id,
            text: review.text,
            rating: review.rating,
            date: review.date,
            collectionTime: review.collectionTime,
            userId: review.userId,
            theme,
            // Остальные поля пока пустые
          },
        });
        processedCount++;
      } catch (err) {
        console.error(`Ошибка при обработке отзыва id=${review.id}:`, err);
        // Можно добавить continue, чтобы не останавливать весь процесс
      }
    }
    res.json({ message: `Обработано ${processedCount} отзывов.` });
  } catch (error: any) {
    console.error("Ошибка массового анализа:", error);
    res.status(500).json({
      error: "Ошибка массового анализа",
      details: error && error.message ? error.message : String(error),
    });
  }
});

// Копировать все отзывы из Review в ProcessedReview (без анализа)
router.post(
  "/copy-all-to-processed",
  authenticateToken,
  isTsar,
  async (req, res) => {
    try {
      const reviews = await prisma.review.findMany();
      let copied = 0;
      for (const review of reviews) {
        const exists = await prisma.processedReview.findUnique({
          where: { reviewId: review.id },
        });
        if (exists) continue;
        await prisma.processedReview.create({
          data: {
            reviewId: review.id,
            text: review.text,
            rating: review.rating,
            date: review.date,
            collectionTime: review.collectionTime,
            userId: review.userId,
          },
        });
        copied++;
      }
      res.json({ message: `Скопировано ${copied} отзывов в ProcessedReview.` });
    } catch (error: any) {
      console.error("Ошибка копирования отзывов:", error);
      res.status(500).json({
        error: "Ошибка копирования отзывов",
        details: error && error.message ? error.message : String(error),
      });
    }
  }
);

// Обновить поле theme для ProcessedReview по id
router.post("/update-theme", authenticateToken, isTsar, async (req, res) => {
  const { id, theme } = req.body;
  if (!id || typeof theme !== "string") {
    res.status(400).json({ error: "Не передан id или theme" });
    return;
  }
  try {
    await prisma.processedReview.update({
      where: { id: Number(id) },
      data: { theme },
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Ошибка обновления theme:", error);
    res.status(500).json({
      error: "Ошибка обновления theme",
      details: error && error.message ? error.message : String(error),
    });
  }
});

// Обновить поле category для ProcessedReview по id
router.post(
  "/analyze-category",
  authenticateToken,
  isTsar,
  async (req, res) => {
    const { id, text } = req.body;
    if (!id || typeof text !== "string") {
      res.status(400).json({ error: "Не передан id или text" });
      return;
    }
    try {
      const category = await analyzeCategory(text);
      await prisma.processedReview.update({
        where: { id: Number(id) },
        data: { category },
      });
      res.json({ category });
    } catch (error: any) {
      console.error("Ошибка анализа category:", error);
      res.status(500).json({
        error: "Ошибка анализа category",
        details: error && error.message ? error.message : String(error),
      });
    }
  }
);

// Обновить поле tags для ProcessedReview по id
router.post("/analyze-tags", authenticateToken, isTsar, async (req, res) => {
  const { id, text } = req.body;
  if (!id || typeof text !== "string") {
    res.status(400).json({ error: "Не передан id или text" });
    return;
  }
  try {
    const tagsArr = await analyzeTags(text);
    await prisma.processedReview.update({
      where: { id: Number(id) },
      data: { tags: tagsArr.join(", ") },
    });
    res.json({ tags: tagsArr });
  } catch (error: any) {
    console.error("Ошибка анализа tags:", error);
    res.status(500).json({
      error: "Ошибка анализа tags",
      details: error && error.message ? error.message : String(error),
    });
  }
});

// Анализировать тональность и обновить ProcessedReview
router.post(
  "/analyze-sentiment",
  authenticateToken,
  isTsar,
  async (req, res) => {
    const { id, text } = req.body;
    if (!id || typeof text !== "string") {
      res.status(400).json({ error: "Не передан id или text" });
      return;
    }
    try {
      const sentiment = await analyzeSentiment(text);
      await prisma.processedReview.update({
        where: { id: Number(id) },
        data: { sentiment },
      });
      res.json({ sentiment });
    } catch (error: any) {
      console.error("Ошибка анализа sentiment:", error);
      res.status(500).json({
        error: "Ошибка анализа sentiment",
        details: error && error.message ? error.message : String(error),
      });
    }
  }
);

// Анализировать приоритет и обновить ProcessedReview
router.post(
  "/analyze-priority",
  authenticateToken,
  isTsar,
  async (req, res) => {
    const { id, text } = req.body;
    if (!id || typeof text !== "string") {
      res.status(400).json({ error: "Не передан id или text" });
      return;
    }
    try {
      const priority = await analyzePriority(text);
      await prisma.processedReview.update({
        where: { id: Number(id) },
        data: { priority },
      });
      res.json({ priority });
    } catch (error: any) {
      console.error("Ошибка анализа priority:", error);
      res.status(500).json({
        error: "Ошибка анализа priority",
        details: error && error.message ? error.message : String(error),
      });
    }
  }
);

// Анализировать упоминание конкурента и обновить ProcessedReview
router.post(
  "/analyze-competitor",
  authenticateToken,
  isTsar,
  async (req, res) => {
    const { id, text } = req.body;
    if (!id || typeof text !== "string") {
      res.status(400).json({ error: "Не передан id или text" });
      return;
    }
    try {
      const competitorMention = await analyzeCompetitorMention(text);
      await prisma.processedReview.update({
        where: { id: Number(id) },
        data: { competitorMention },
      });
      res.json({ competitorMention });
    } catch (error: any) {
      console.error("Ошибка анализа competitorMention:", error);
      res.status(500).json({
        error: "Ошибка анализа competitorMention",
        details: error && error.message ? error.message : String(error),
      });
    }
  }
);

// Обнулить аналитические поля ProcessedReview по id (теперь поддерживает theme и category)
router.post(
  "/update-analysis-fields",
  authenticateToken,
  isTsar,
  async (req, res) => {
    const {
      id,
      theme,
      sentiment,
      category,
      priority,
      competitorMention,
      tags,
    } = req.body;
    if (!id) {
      res.status(400).json({ error: "Не передан id" });
      return;
    }
    try {
      await prisma.processedReview.update({
        where: { id: Number(id) },
        data: {
          theme,
          sentiment,
          category,
          priority,
          competitorMention,
          tags,
        },
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Ошибка очистки аналитических полей:", error);
      res.status(500).json({
        error: "Ошибка очистки аналитических полей",
        details: error && error.message ? error.message : String(error),
      });
    }
  }
);

// Получить статистику отзывов
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    // Получаем общее количество отзывов
    const totalReviews = await prisma.processedReview.count();

    // Получаем количество негативных отзывов
    const negativeReviews = await prisma.processedReview.count({
      where: {
        sentiment: "Негативный",
      },
    });

    // Получаем количество критически важных отзывов
    const criticalReviews = await prisma.processedReview.count({
      where: {
        priority: "Очень важный",
      },
    });

    // Получаем количество отзывов с упоминанием конкурентов
    const competitorMentions = await prisma.processedReview.count({
      where: {
        competitorMention: "TRUE",
      },
    });

    res.json({
      totalReviews,
      negativeReviews,
      criticalReviews,
      competitorMentions,
    });
  } catch (error) {
    console.error("Error fetching review statistics:", error);
    res.status(500).json({ error: "Ошибка при получении статистики отзывов" });
  }
});

// Топ по категориям и приоритетам
router.get("/top-categories", authenticateToken, async (req, res) => {
  try {
    // Группируем по category и priority, считаем количество
    const result = await prisma.processedReview.groupBy({
      by: ["category", "priority"],
      _count: { id: true },
      orderBy: [{ _count: { id: "desc" } }],
    });
    // Формируем ответ
    const top = result.map((item) => ({
      category: item.category || "Без категории",
      priority: item.priority || "Не указан",
      count: item._count.id,
    }));
    res.json(top);
  } catch (error) {
    console.error("Error fetching top categories:", error);
    res.status(500).json({ error: "Ошибка при получении топа категорий" });
  }
});

// Генерация AI-рекомендации (POST /api/reviews/ai-recommendation)
router.post("/ai-recommendation", authenticateToken, async (req, res) => {
  const { category, theme } = req.body;
  if (!category) {
    res.status(400).json({ error: "Не передан category" });
    return;
  }
  try {
    const text = await generateTextRecommendation(category);
    const saved = await prisma.aIRecommendation.upsert({
      where: {
        ai_category_theme: {
          category,
          theme: theme || "",
        },
      },
      update: { text },
      create: { category, theme, text },
    });
    res.json({ recommendation: saved.text });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: error.message || "Ошибка генерации AI-рекомендации" });
  }
});

// Получить AI-рекомендации (GET /api/reviews/ai-recommendations)
router.get("/ai-recommendations", authenticateToken, async (req, res) => {
  const { category, theme } = req.query;
  try {
    const where: any = {};
    if (category) where.category = String(category);
    if (theme !== undefined) where.theme = String(theme);
    const recommendations = await prisma.aIRecommendation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении AI-рекомендаций" });
  }
});

// Генерация рекомендации конкурентов (POST /api/reviews/competitor-recommendation)
router.post(
  "/competitor-recommendation",
  authenticateToken,
  async (req, res) => {
    const { category, theme } = req.body;
    if (!category) {
      res.status(400).json({ error: "Не передан category" });
      return;
    }
    try {
      const text = await generateTextRecommendation(category);
      const saved = await prisma.competitorRecommendation.upsert({
        where: {
          competitor_category_theme: {
            category,
            theme: theme || "",
          },
        },
        update: { text },
        create: { category, theme, text },
      });
      res.json({ recommendation: saved.text });
    } catch (error: any) {
      res
        .status(500)
        .json({
          error: error.message || "Ошибка генерации рекомендации конкурентов",
        });
    }
  }
);

// Получить рекомендации конкурентов (GET /api/reviews/competitor-recommendations)
router.get(
  "/competitor-recommendations",
  authenticateToken,
  async (req, res) => {
    const { category, theme } = req.query;
    try {
      const where: any = {};
      if (category) where.category = String(category);
      if (theme !== undefined) where.theme = String(theme);
      const recommendations = await prisma.competitorRecommendation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
      });
      res.json({ recommendations });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Ошибка при получении рекомендаций конкурентов" });
    }
  }
);

// Массовое обновление обработанных отзывов (bulk update)
router.post(
  "/processed/bulk-update",
  authenticateToken,
  isTsar,
  async (req, res) => {
    const { reviews } = req.body;
    if (!Array.isArray(reviews)) {
      res.status(400).json({ error: "reviews должен быть массивом" });
      return;
    }
    try {
      await prisma.$transaction(
        reviews
          .map((r) => {
            // Обновляем ProcessedReview
            const processedUpdate = prisma.processedReview.update({
              where: { id: r.id },
              data: {
                theme: r.theme,
                sentiment: r.sentiment,
                category: r.category,
                priority: r.priority,
                competitorMention: r.competitorMention,
                tags: Array.isArray(r.tags) ? r.tags.join(",") : null,
              },
            });
            // Обновляем связанные поля в Review (если нужно)
            const reviewUpdate = prisma.review.update({
              where: { id: r.id },
              data: {
                rating: r.rating,
                text: r.text,
                date: r.date,
                collectionTime: r.collectionTime,
              },
            });
            return [processedUpdate, reviewUpdate];
          })
          .flat()
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Ошибка bulk-update:", error);
      const err = error as any;
      res
        .status(500)
        .json({
          error: "Ошибка при массовом обновлении отзывов",
          details: err.message,
          stack: err.stack,
        });
    }
  }
);

export default router;
