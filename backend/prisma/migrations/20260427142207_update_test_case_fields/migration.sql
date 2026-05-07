/*
  Warnings:

  - You are about to drop the column `automationTags` on the `test_cases` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "test_cases" DROP COLUMN "automationTags",
ADD COLUMN     "method" TEXT DEFAULT 'Manual',
ADD COLUMN     "testFolder" TEXT,
ADD COLUMN     "type" TEXT DEFAULT 'Functional',
ADD COLUMN     "workProduct" TEXT,
ALTER COLUMN "priority" SET DEFAULT 'Medium',
ALTER COLUMN "status" SET DEFAULT 'New';

-- CreateIndex
CREATE INDEX "test_cases_createdAt_idx" ON "test_cases"("createdAt");

-- CreateIndex
CREATE INDEX "test_plans_generatedAt_idx" ON "test_plans"("generatedAt");
