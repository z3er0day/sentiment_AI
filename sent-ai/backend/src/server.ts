import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import reviewRoutes from "./routes/reviews";

const app = express();

app.use(cors());
// Увеличиваем лимит размера JSON
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Регистрация маршрутов
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
