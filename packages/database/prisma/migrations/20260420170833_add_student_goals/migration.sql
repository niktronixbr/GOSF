-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "student_goals" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_goals_studentId_idx" ON "student_goals"("studentId");

-- AddForeignKey
ALTER TABLE "student_goals" ADD CONSTRAINT "student_goals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
