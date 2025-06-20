import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware для проверки JWT токена
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Недействительный токен" });
    }
    req.user = user;
    next();
  });
};

// Регистрация
router.post("/register", async (req: any, res: any) => {
  try {
    const { fullName, organization } = req.body;

    if (!fullName || !organization) {
      return res
        .status(400)
        .json({ error: "Все поля обязательны для заполнения" });
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        organization,
        role: "worker", // По умолчанию роль worker
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        fullName: user.fullName,
        organization: user.organization,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        organization: user.organization,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Ошибка при регистрации" });
  }
});

// Вход
router.post("/login", async (req: any, res: any) => {
  try {
    const { fullName, organization } = req.body;

    if (!fullName || !organization) {
      return res
        .status(400)
        .json({ error: "Все поля обязательны для заполнения" });
    }

    const user = await prisma.user.findFirst({
      where: {
        fullName,
        organization,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Неверные учетные данные" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        fullName: user.fullName,
        organization: user.organization,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        organization: user.organization,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Ошибка при входе" });
  }
});

// Получение данных пользователя
router.get("/me", authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json({
      id: user.id,
      fullName: user.fullName,
      organization: user.organization,
      role: user.role,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Ошибка при получении данных пользователя" });
  }
});

export default router;
