-- CreateTable
CREATE TABLE "facilitators" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "facilitators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilitator_sessions" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "facilitatorId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facilitator_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohorts" (
    "id" UUID NOT NULL,
    "facilitatorId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "term" TEXT,
    "joinCode" TEXT NOT NULL,
    "teamSize" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'collecting',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "cohortId" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "joinedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "cohortId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "cohortId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facilitators_email_key" ON "facilitators"("email");

-- CreateIndex
CREATE UNIQUE INDEX "facilitator_sessions_tokenHash_key" ON "facilitator_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "facilitator_sessions_facilitatorId_idx" ON "facilitator_sessions"("facilitatorId");

-- CreateIndex
CREATE INDEX "facilitator_sessions_expiresAt_idx" ON "facilitator_sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_joinCode_key" ON "cohorts"("joinCode");

-- CreateIndex
CREATE INDEX "cohorts_facilitatorId_createdAt_idx" ON "cohorts"("facilitatorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "students_cohortId_email_key" ON "students"("cohortId", "email");

-- CreateIndex
CREATE INDEX "projects_cohortId_idx" ON "projects"("cohortId");

-- CreateIndex
CREATE INDEX "teams_cohortId_idx" ON "teams"("cohortId");

-- AddForeignKey
ALTER TABLE "facilitator_sessions" ADD CONSTRAINT "facilitator_sessions_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "facilitators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "facilitators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
