-- CreateTable
CREATE TABLE "answers" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "questionsVersion" TEXT NOT NULL DEFAULT '1',
    "answeredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "answers_studentId_questionnaireId_idx" ON "answers"("studentId", "questionnaireId");

-- CreateIndex
CREATE UNIQUE INDEX "answers_studentId_questionId_key" ON "answers"("studentId", "questionId");

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
