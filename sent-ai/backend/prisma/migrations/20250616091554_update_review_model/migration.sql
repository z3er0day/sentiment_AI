/*
  Warnings:

  - You are about to alter the column `rating` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "date" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "time" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "rating" SET DATA TYPE INTEGER;
