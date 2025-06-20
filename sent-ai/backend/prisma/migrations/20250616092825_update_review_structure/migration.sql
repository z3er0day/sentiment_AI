/*
  Warnings:

  - You are about to drop the column `time` on the `Review` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Review" DROP COLUMN "time",
ADD COLUMN     "collectionTime" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "date" DROP DEFAULT;
