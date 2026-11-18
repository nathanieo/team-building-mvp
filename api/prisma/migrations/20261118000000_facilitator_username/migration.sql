-- Usernames are optional so existing accounts keep logging in with their email.
-- AlterTable
ALTER TABLE "facilitators" ADD COLUMN "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "facilitators_username_key" ON "facilitators"("username");
