-- CreateTable
CREATE TABLE "student_sessions" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "studentId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_sessions_tokenHash_key" ON "student_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "student_sessions_studentId_idx" ON "student_sessions"("studentId");

-- CreateIndex
CREATE INDEX "student_sessions_expiresAt_idx" ON "student_sessions"("expiresAt");

-- AddForeignKey
ALTER TABLE "student_sessions" ADD CONSTRAINT "student_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
