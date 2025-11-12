-- CreateEnum
CREATE TYPE "GameCategory" AS ENUM ('BATTLE_ROYALE', 'FPS', 'SPORTS', 'MOBA', 'RPG', 'STRATEGY', 'RACING', 'SIMULATION', 'OTHER');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'FEATURED');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "accountAge" INTEGER,
ADD COLUMN     "accountRank" TEXT,
ADD COLUMN     "accountRegion" TEXT,
ADD COLUMN     "gameId" TEXT,
ADD COLUMN     "hasRareItems" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" "GameCategory" NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'ACTIVE',
    "icon" TEXT,
    "banner" TEXT,
    "platforms" TEXT[],
    "minLevel" INTEGER,
    "maxLevel" INTEGER,
    "features" TEXT[],
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "games_name_key" ON "games"("name");

-- CreateIndex
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
