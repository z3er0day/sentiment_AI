-- CreateTable
CREATE TABLE "Recommendation" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "theme" TEXT,
    "text" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);
