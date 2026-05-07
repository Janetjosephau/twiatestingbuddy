# 🚀 Testing Buddy AI Dashboard - Project Constitution

**Version:** 1.0  
**Last Updated:** April 22, 2026  
**Status:** Phase 1 - Blueprint (In Progress)

---

## 📋 Project Overview

**North Star Goal:** Build a comprehensive Testing Buddy AI Dashboard that generates test plans and test cases by integrating with LLM providers and Rally, with reporting & analytics capabilities.

**Core Modules:**
1. Dashboard (Insights & Metrics)
2. LLM Configuration
3. Rally Integration
4. Test Plan Generator
5. Test Case Generator
6. Reports & Analytics

---

## 🎯 Discovery Answers (Phase 1: Blueprint)

| Question | Answer |
|----------|--------|
| **North Star** | Generate test plans/cases via AI → Display in dashboard → Sync to Rally |
| **Integrations Ready** | Rally, LLM providers (configurable), TestLink |
| **Source of Truth** | Rally (requirements/stories) + Generated artifacts (PostgreSQL) |
| **Delivery Payload** | UI display + Rally sync + PDF/JSON export |
| **Behavioral Rules** | Prevent duplicates; graceful error handling; auto-retry on sync failure |

---

## 📊 Data Schemas (Layer 1: Architecture)

### 1. LLM Configuration Payload
```typescript
interface LLMConfig {
  id: string;
  provider: "openai" | "gemini" | "ollama" | "lmstudio" | "grok";
  name: string;
  apiKey: string;
  apiUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  createdAt: ISO8601;
  lastTestedAt?: ISO8601;
  testStatus: "untested" | "connected" | "failed";
  testError?: string;
}
```

### 2. Jira Configuration Payload
```typescript
interface JiraConfig {
  id: string;
  instanceUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  createdAt: ISO8601;
  lastTestedAt?: ISO8601;
  testStatus: "untested" | "connected" | "failed";
  testError?: string;
}
```

### 3. Test Plan Payload
```typescript
interface TestPlan {
  id: string;
  name: string;
  description: string;
  jiraIssueId: string;
  generatedBy: string; // LLM provider
  generatedAt: ISO8601;
  content: {
    objectives: string[];
    scope: string;
    strategy: string;
    resources: string[];
    timeline: string;
    exitCriteria: string[];
  };
  testCases: TestCase[];
  exportFormat?: "pdf" | "json";
  status: "draft" | "finalized" | "synced_to_jira";
}
```

### 4. Test Case Payload
```typescript
interface TestCase {
  id: string;
  testPlanId: string;
  caseId: string;
  title: string;
  preconditions: string[];
  steps: {
    action: string;
    expectedResult: string;
  }[];
  postconditions: string[];
  priority: "low" | "medium" | "high" | "critical";
  status: "draft" | "selected" | "synced_to_rally";
  testData?: string;
  automationTags?: string[];
  createdAt: ISO8601;
}
```

### 5. Jira Requirement (Fetch Response)
```typescript
interface JiraRequirement {
  issueId: string;
  key: string;
  title: string;
  description: string;
  issueType: string;
  status: string;
  priority: string;
}
```

### 6. Dashboard Metrics Payload
```typescript
interface DashboardMetrics {
  totalTestPlans: number;
  totalTestCases: number;
  generatedToday: number;
  syncedToJira: number;
  syncedToRally: number;
  recentActivity: Activity[];
  coverage: {
    manual: number;
    automated: number;
    coverage_percentage: number;
  };
}

interface Activity {
  type: "test_plan_generated" | "test_case_generated" | "synced_to_jira" | "synced_to_rally";
  title: string;
  timestamp: ISO8601;
  status: "success" | "pending" | "failed";
}
```

---

## 🛡️ Behavioral Rules

### ✅ Must-Haves
- **Duplicate Prevention:** Check existing test plans before generating
- **Error Handling:** Graceful fallbacks for API failures
- **State Persistence:** All configurations saved to PostgreSQL
- **Connection Validation:** Test connection before save

### ❌ Must-Not-Dos
- Do NOT call LLM/Jira APIs without validating credentials first
- Do NOT allow generation without active LLM + Jira configs
- Do NOT lose generated content on page refresh

### ⚙️ Auto-Retry Logic
- Failed Jira syncs: Retry up to 3 times with exponential backoff
- Failed LLM calls: Show user error, allow manual retry

---

## 📁 Project Structure

```
QaTestingBuddy AI/
├── gemini.md                 # This file (Project Constitution)
├── .env                      # API Keys (NOT in git)
├── package.json              # Monorepo root
├── architecture/             # Layer 1: SOPs & Specifications
│   ├── README.md
│   ├── LLM_Configuration.md
│   ├── Jira_Integration.md
│   ├── TestPlan_Generator.md
│   ├── TestCase_Generator.md
│   └── Analytics_Module.md
├── frontend/                 # Layer 2/3: React + Tailwind UI
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── types.ts
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       └── services/
├── backend/                  # Layer 2/3: Node.js API
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── server.ts
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── adapters/
│       └── utils/
├── tools/                    # Layer 3: Python/Node utilities
│   ├── llm_tester.py
│   ├── jira_tester.py
│   └── export_handler.py
└── .tmp/                     # Temporary workbench (ephemeral)
```

---

## 🔄 Architecture Layers (A.N.T.)

### **Layer 1: Architecture** (`architecture/` folder)
- Technical SOPs for each feature module
- Define inputs, outputs, logic, edge cases
- Updated BEFORE code changes

### **Layer 2: Navigation** (React Router + State Management)
- Route between pages and features
- State coordination (Redux/Zustand)
- Handle API calls to Layer 3

### **Layer 3: Tools** (Backend APIs + DB)
- Express/NestJS endpoints
- PostgreSQL persistence
- LLM + Jira adapter layer

---

## 🛡️ Architectural Invariants

1. **Config Validation:** All API credentials must pass `testConnection()` before save
2. **Data Isolation:** Each connection (LLM/Jira) independently testable
3. **Export Formats:** Support JSON, PDF, and direct Jira/Rally sync
4. **History Tracking:** All generated artifacts logged with timestamps

---

## 📝 Maintenance Log

### v1.0 (Initialization - April 22, 2026)
- Created project structure following B.L.A.S.T. protocol
- Defined data schemas for all major features
- Established behavioral rules and error handling patterns

---

## 🚦 Current Phase: Phase 1 - Blueprint

**Status:** Awaiting answers to complete Discovery

**Next Steps:**
1. ✅ Create project memory files (`task_plan.md`, `findings.md`, `progress.md`)
2. ⏳ Define UI component structure
3. ⏳ Set up backend data models
4. ⏳ Move to Phase 2: Link (Verify API connectivity)

---

## 📞 Contact & Approvals

- **Project Owner:** AI Testing Team
- **Last Updated By:** System Pilot
- **Approval Status:** Pending Discovery Confirmation
