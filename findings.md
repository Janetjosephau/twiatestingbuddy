# 🔍 Findings & Discoveries

**Version:** 1.0  
**Created:** April 22, 2026  
**Last Updated:** April 22, 2026

---

## 📸 UI Reference Analysis

### Dashboard (`TC_Dashboard.png`)
- **Layout:** Left sidebar + main content area
- **Sidebar Items:**
  - Logo/Branding
  - Dashboard (home)
  - Connections (dropdown)
    - LLM Configuration
    - Jira Integration
  - Generator (dropdown)
    - Test Plan
    - Test Case
  - Reports & Analytics

- **Main Content:**
  - Top section: Welcome message + key metrics
  - Cards showing: Test Plans, Test Cases, Coverage, Synced items
  - Recent Activity section with timeline

### LLM Configuration (`TC_LLM Connection.png`)
- **Form Fields:**
  - Provider dropdown (OpenAI, Gemini, Ollama, etc.)
  - API Key input (masked)
  - API URL (optional, for self-hosted)
  - Model dropdown (varies by provider)
  - Temperature slider
  - Max Tokens slider
  - Test Connection button
  - Save button

- **Connection UI:**
  - Status indicator (Connected/Disconnected)
  - Last tested timestamp
  - Error message display area

### Jira Configuration (`TC_Jira_Connection.png`)
- **Form Fields:**
  - Jira Instance URL
  - Email
  - API Token (masked)
  - Project Key
  - Test Connection button
  - Save button

- **Connection UI:**
  - Status indicator
  - Project validation feedback

### Test Plan Generator (`TC_Testplan_UI.png`)
- **Workflow:**
  1. Fetch Details button → Pull Jira requirements
  2. Display fetched requirements in panel
  3. Generate Test Plan button → LLM generates
  4. Display generated plan in modal/sidebar
  5. Export button → JSON/PDF
  6. History panel → Previous plans

- **UI Elements:**
  - Requirement selection (multi-select)
  - Plan preview area
  - Export button with format choice
  - History list with timestamps

### Test Case Generator (`TC_TestCase_UI_1.png`, `TC_TestCase_UI_2.png`)
- **Workflow:**
  1. Fetch Details button (NEW) → Pull requirements
  2. Generate Test Case button → LLM generates
  3. Multi-select test cases from generated list
  4. Upload to Rally button → Sync selected cases
  5. Export button → Download cases

- **Field Renames:**
  - "Testlink Project" → "Rally Project"
  - "Generate to Testlink" → "Generate Test Case"

---

## 🔧 Technical Decisions

### Frontend Stack
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Build:** Vite
- **State Management:** TBD (Redux, Zustand, or Context API)
- **API Client:** Axios or Fetch API
- **Forms:** React Hook Form + Zod validation

### Backend Stack
- **Runtime:** Node.js 18+
- **Framework:** Express or NestJS
- **Database:** PostgreSQL 14+
- **ORM:** Prisma
- **API Style:** RESTful
- **Authentication:** TBD (JWT or session-based)

### Adapters
- **LLM:** Support multiple providers (OpenAI, Gemini, Ollama, LMStudio, Grok)
- **Jira:** Cloud API (REST v3)
- **Rally:** REST API
- **Export:** JSON serialization, PDF generation (PDFKit or similar)

---

## 📋 Data Flow Observations

### Test Plan Generation Flow
```
1. User configures LLM + Jira
2. User clicks "Fetch Details" → Backend calls Jira API
3. Backend returns list of requirements
4. User selects requirements → Frontend sends selection
5. Backend calls LLM API with requirements
6. LLM generates test plan structure
7. Backend stores plan in PostgreSQL
8. Frontend displays plan in modal/panel
9. User clicks Export → Backend generates PDF/JSON
10. User clicks Save → Plan stored with status "finalized"
```

### Test Case Generation Flow
```
1. Similar to Test Plan, but generates individual test cases
2. Each test case has: title, preconditions, steps, postconditions, priority
3. User multi-selects cases from generated list
4. User clicks "Upload to Rally" → Backend syncs via Rally API
5. Each case gets status "synced_to_rally"
```

---

## ⚠️ Known Constraints

1. **LLM Context Length:** Different providers have different limits
2. **Jira Rate Limiting:** Cloud API has rate limits (need to implement backoff)
3. **Rally Integration:** Need to verify API documentation
4. **PDF Export:** Need to handle large test plans gracefully

---

## ✅ Confirmed Patterns

1. **Connection Testing:** Test before save (consistent across LLM/Jira)
2. **Error Messages:** Display error details to user, log to backend
3. **Async Operations:** Use loading indicators during fetch/generate
4. **History Tracking:** Store all generated artifacts with timestamps
5. **Multi-step Workflows:** Fetch → Generate → Review → Export/Sync

---

## 🚀 Integration Points

1. **Jira Cloud:** REST API, OAuth/Token auth
2. **LLM Providers:** Various APIs (OpenAI, Gemini, Ollama, etc.)
3. **Rally (TestLink):** REST API for test case upload
4. **PostgreSQL:** Store configs, test plans, test cases
5. **File Export:** JSON + PDF formats

---

## 📝 Notes for Future Phases

- Consider implementing **webhook support** for Jira updates
- Plan for **bulk generation** feature (multiple requirements at once)
- Add **template customization** for test plan/case generation
- Implement **audit logging** for compliance tracking
