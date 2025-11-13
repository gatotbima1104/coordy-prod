/*
  Warnings:

  - You are about to drop the column `appleId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[supabaseId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `supabaseId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."users_appleId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "appleId",
ADD COLUMN     "supabaseId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");
