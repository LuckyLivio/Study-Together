/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `couples` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inviteCode` to the `couples` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."couples" ADD COLUMN     "inviteCode" TEXT NOT NULL,
ADD COLUMN     "isComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "person1Id" TEXT,
ADD COLUMN     "person1Name" TEXT,
ADD COLUMN     "person2Id" TEXT,
ADD COLUMN     "person2Name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "couples_inviteCode_key" ON "public"."couples"("inviteCode");
