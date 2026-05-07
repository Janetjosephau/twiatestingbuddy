-- CreateTable
CREATE TABLE "llm_configs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiUrl" TEXT,
    "model" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION DEFAULT 0.7,
    "maxTokens" INTEGER DEFAULT 2048,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTestedAt" TIMESTAMP(3),
    "testStatus" TEXT NOT NULL DEFAULT 'untested',
    "testError" TEXT,

    CONSTRAINT "llm_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jira_configs" (
    "id" TEXT NOT NULL,
    "instanceUrl" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "projectKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTestedAt" TIMESTAMP(3),
    "testStatus" TEXT NOT NULL DEFAULT 'untested',
    "testError" TEXT,

    CONSTRAINT "jira_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rally_configs" (
    "id" TEXT NOT NULL,
    "instanceUrl" TEXT NOT NULL DEFAULT 'https://rally1.rallydev.com',
    "apiKey" TEXT NOT NULL,
    "workspaceName" TEXT,
    "projectName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTestedAt" TIMESTAMP(3),
    "testStatus" TEXT NOT NULL DEFAULT 'untested',
    "testError" TEXT,

    CONSTRAINT "rally_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jiraIssueId" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "exportFormat" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "jiraConfigId" TEXT,

    CONSTRAINT "test_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "testPlanId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "preconditions" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "postconditions" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "testData" TEXT,
    "automationTags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "llm_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_jiraConfigId_fkey" FOREIGN KEY ("jiraConfigId") REFERENCES "jira_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "test_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
