/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `ArchivedParticipant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ArchivedParticipant_email_key" ON "ArchivedParticipant"("email");
