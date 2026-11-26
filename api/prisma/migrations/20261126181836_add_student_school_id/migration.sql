/*
  Warnings:

  - A unique constraint covering the columns `[cohortId,schoolId]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `schoolId` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "students" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "students_cohortId_schoolId_key" ON "students"("cohortId", "schoolId");
