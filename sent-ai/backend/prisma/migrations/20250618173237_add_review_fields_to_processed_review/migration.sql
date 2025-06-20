/*
  Warnings:

  - Added the required column `collectionTime` to the `ProcessedReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `ProcessedReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rating` to the `ProcessedReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `ProcessedReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ProcessedReview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProcessedReview" ADD COLUMN     "collectionTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "text" TEXT NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;
