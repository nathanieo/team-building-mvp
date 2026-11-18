-- Team size can be a range (e.g. 3-4). Existing classes keep their fixed size.
-- AlterTable
ALTER TABLE "cohorts" ADD COLUMN "teamSizeMax" INTEGER;
UPDATE "cohorts" SET "teamSizeMax" = "teamSize";
ALTER TABLE "cohorts" ALTER COLUMN "teamSizeMax" SET NOT NULL;
