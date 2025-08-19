-- CreateEnum
CREATE TYPE "public"."TaskType" AS ENUM ('CHECKIN', 'POMODORO', 'READING', 'EXERCISE', 'REVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'STICKER', 'SURPRISE', 'MIXED');

-- CreateEnum
CREATE TYPE "public"."MessageVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateTable
CREATE TABLE "public"."study_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."study_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "planDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."study_tasks" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" "public"."TaskType" NOT NULL,
    "duration" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_wall_posts" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "visibility" "public"."MessageVisibility" NOT NULL DEFAULT 'PRIVATE',
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "surpriseType" TEXT,
    "surpriseData" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_wall_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_emoji_key" ON "public"."message_reactions"("messageId", "userId", "emoji");

-- AddForeignKey
ALTER TABLE "public"."study_goals" ADD CONSTRAINT "study_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_plans" ADD CONSTRAINT "study_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_tasks" ADD CONSTRAINT "study_tasks_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_wall_posts" ADD CONSTRAINT "message_wall_posts_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_wall_posts" ADD CONSTRAINT "message_wall_posts_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."message_wall_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_reactions" ADD CONSTRAINT "message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
