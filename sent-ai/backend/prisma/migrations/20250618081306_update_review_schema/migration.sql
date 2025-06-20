/*
  Warnings:

  - Added the required column `userId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `date` on the `Review` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `collectionTime` on the `Review` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "rating" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
DROP COLUMN "collectionTime",
ADD COLUMN     "collectionTime" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
