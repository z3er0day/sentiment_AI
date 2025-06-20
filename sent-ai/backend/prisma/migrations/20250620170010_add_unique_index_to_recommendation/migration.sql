/*
  Warnings:

  - A unique constraint covering the columns `[category,theme,source]` on the table `Recommendation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_category_theme_source_key" ON "Recommendation"("category", "theme", "source");
