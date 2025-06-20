-- CreateTable
CREATE TABLE "AIRecommendation" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "theme" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorRecommendation" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "theme" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIRecommendation_category_theme_key" ON "AIRecommendation"("category", "theme");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorRecommendation_category_theme_key" ON "CompetitorRecommendation"("category", "theme");
