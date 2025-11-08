-- CreateEnum
CREATE TYPE "StatusLocation" AS ENUM ('ONSITE', 'REMOTE');

-- AlterEnum
ALTER TYPE "StatusCard" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "location" "StatusLocation" NOT NULL DEFAULT 'ONSITE';
