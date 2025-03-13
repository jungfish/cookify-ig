/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Recipe` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_url_key" ON "Recipe"("url");
