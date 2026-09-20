
-- AlterTable
ALTER TABLE "Material" ADD COLUMN "notes" JSONB;
ALTER TABLE "Material" ADD COLUMN "notesAt" DATETIME;
ALTER TABLE "Material" ADD COLUMN "notesHash" TEXT;
ALTER TABLE "Material" ADD COLUMN "notesLanguage" TEXT;
ALTER TABLE "Material" ADD COLUMN "unsupported" TEXT;

