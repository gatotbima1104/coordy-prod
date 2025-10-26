/*
  Warnings:

  - The values [DRAFT] on the enum `StatusCard` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Duration" ADD VALUE 'QUARTER';
ALTER TYPE "Duration" ADD VALUE 'THREE_QUARTER';

-- AlterEnum
BEGIN;
CREATE TYPE "StatusCard_new" AS ENUM ('WAITING_RESPONSE', 'NEED_ACTION', 'COMPLETED');
ALTER TABLE "public"."events" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "events" ALTER COLUMN "status" TYPE "StatusCard_new" USING ("status"::text::"StatusCard_new");
ALTER TYPE "StatusCard" RENAME TO "StatusCard_old";
ALTER TYPE "StatusCard_new" RENAME TO "StatusCard";
DROP TYPE "public"."StatusCard_old";
ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'WAITING_RESPONSE';
COMMIT;

-- AlterTable
ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'WAITING_RESPONSE';
