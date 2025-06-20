-- CreateTable
CREATE TABLE "ProcessedReview" (
    "id" SERIAL NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "theme" TEXT,
    "sentiment" TEXT,
    "category" TEXT,
    "priority" TEXT,
    "competitorMention" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessedReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedReview_reviewId_key" ON "ProcessedReview"("reviewId");

-- AddForeignKey
ALTER TABLE "ProcessedReview" ADD CONSTRAINT "ProcessedReview_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
