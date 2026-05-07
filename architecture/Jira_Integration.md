# 🏗️ Jira Integration Module - Architecture SOP

**Version:** 1.0  
**Created:** April 22, 2026  
**Status:** Phase 1 - Design Complete

---

## 📌 Module Overview

**Purpose:** Allow users to securely configure and test Jira Cloud connections, validate project access, and fetch requirements for test generation.

**Owner:** System Pilot  
**Layer:** Layer 1 Architecture (SOP)

---

## 🎯 Goals

1. ✅ Securely store Jira instance credentials
2. ✅ Validate project access and permissions
3. ✅ Fetch requirements/issues from Jira
4. ✅ Display connection status
5. ✅ Support multiple Jira projects (future)

---

## 📊 Input/Output Schemas

### Input Payload (Form)
```typescript
{
  instanceUrl: string,             // https://your-domain.atlassian.net
  email: string,                   // User email
  apiToken: string,                // Jira API token (encrypted)
  projectKey: string,              // e.g., "TEST", "QA"
}
```

### Output Payload (Saved Config)
```typescript
{
  id: uuid,
  instanceUrl: string,
  email: string,
  apiToken: string,                // Encrypted
  projectKey: string,
  projectName: string,             // Fetched from Jira
  createdAt: ISO8601,
  lastTestedAt?: ISO8601,
  testStatus: "untested" | "connected" | "failed",
  testError?: string,
}
```

### Fetch Requirements Response
```typescript
{
  success: boolean,
  requirements: [
    {
      issueId: string,             // e.g., "TEST-123"
      key: string,
      title: string,
      description: string,
      issueType: string,            // e.g., "Story", "Task", "Bug"
      status: string,               // e.g., "Open", "In Progress"
      priority: string,             // e.g., "High", "Low"
    }
  ],
  totalCount: number,
}
```

---

## 🔄 Functional Logic

### Use Case 1: Create Jira Connection

**Preconditions:**
- User is on Jira Integration page
- Jira instance URL and credentials available

**Steps:**
1. User enters Jira instance URL (e.g., https://company.atlassian.net)
2. User enters email address
3. User enters API token (masked in UI)
4. User enters project key (e.g., "TEST")
5. User clicks "Test Connection"
   - Backend validates URL format
   - Backend makes test API call to Jira
   - Fetches project details to verify access
   - If ✅ Success: Show "Connection Successful" + Project name
   - If ❌ Failed: Show error (e.g., "Invalid URL", "Unauthorized", "Project not found")
6. User clicks "Save Configuration"
   - Backend encrypts API token
   - Backend stores config in `jira_configs` table
   - Show "Jira Connection Saved" message
7. Config appears in sidebar + Jira Integration page

---

### Use Case 2: Edit Jira Connection

**Preconditions:**
- Jira config exists
- User clicks "Edit"

**Steps:**
1. Form pre-fills with existing values (API token masked)
2. User modifies any field
3. User clicks "Test Connection" → Validates updated config
4. User clicks "Save" → Backend updates config
5. Show "Configuration Updated" message

---

### Use Case 3: Fetch Requirements

**Preconditions:**
- Jira connection is active and tested
- User navigates to Test Plan or Test Case Generator

**Steps:**
1. User clicks "Fetch Details" button
2. Frontend sends: `GET /api/jira/requirements?configId=<id>`
3. Backend:
   - Loads Jira config from database
   - Makes API call to Jira: `GET /rest/api/3/issues?jql=project=<KEY> AND issuetype in (Story, Requirement)`
   - Parses response
   - Returns list of requirements
4. Frontend displays requirements in list/panel
5. User can select/filter requirements

---

## 🔌 Connection Testing Logic

### Test Connection Endpoint

**Route:** `POST /api/jira/test-connection`

**Request:**
```json
{
  "instanceUrl": "https://company.atlassian.net",
  "email": "user@company.com",
  "apiToken": "ATATT...",
  "projectKey": "TEST"
}
```

**Response (Success):**
```json
{
  "status": "connected",
  "projectKey": "TEST",
  "projectName": "Testing Project",
  "projectUrl": "https://company.atlassian.net/browse/TEST",
  "message": "Connection Successful",
  "timestamp": "2026-04-22T12:00:00Z"
}
```

**Response (Failure):**
```json
{
  "status": "failed",
  "error": "Unauthorized",
  "message": "Invalid email or API token",
  "timestamp": "2026-04-22T12:00:00Z"
}
```

---

## 📡 Jira API Calls

### Endpoint 1: Validate Connection
```
GET /rest/api/3/myself
Headers:
  Authorization: Basic base64(email:apiToken)
  Accept: application/json
```

### Endpoint 2: Get Project Details
```
GET /rest/api/3/project/{projectKey}
Headers:
  Authorization: Basic base64(email:apiToken)
  Accept: application/json
```

### Endpoint 3: Fetch Requirements
```
GET /rest/api/3/issues?jql=project={projectKey}+AND+issuetype+in+(Story,Task,Requirement)&maxResults=100&expand=changelog
Headers:
  Authorization: Basic base64(email:apiToken)
  Accept: application/json
```

---

## 💾 Database Schema

### Table: `jira_configs`
```sql
CREATE TABLE jira_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_url VARCHAR(500) NOT NULL,
  email VARCHAR(255) NOT NULL,
  api_token VARCHAR(500) NOT NULL, -- Encrypted
  project_key VARCHAR(50) NOT NULL,
  project_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_tested_at TIMESTAMP,
  test_status VARCHAR(50) DEFAULT 'untested',
  test_error TEXT,
  created_by_user_id UUID,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  UNIQUE (instance_url, project_key)
);
```

---

## 🛡️ Security Considerations

1. **API Token Encryption:**
   - Store encrypted with AES-256
   - Never expose in API responses

2. **Rate Limiting:**
   - Jira Cloud has rate limits (300 requests/minute)
   - Implement queue with exponential backoff

3. **OAuth (Future):**
   - Consider OAuth 2.0 instead of token-based auth
   - Better security and user experience

4. **Audit Logging:**
   - Log all fetches and API calls
   - Track which requirements were used for generation

---

## 🧪 Test Cases

### TC-1: Valid Jira Connection
- [ ] User enters valid instance URL, email, API token
- [ ] Connection test succeeds
- [ ] Project name fetched and displayed
- [ ] Config saved to database

### TC-2: Invalid API Token
- [ ] User enters wrong API token
- [ ] Connection test fails with "Unauthorized" error
- [ ] User can retry with correct token

### TC-3: Project Not Found
- [ ] User enters non-existent project key
- [ ] Connection test fails with "Project not found"
- [ ] Error message is clear

### TC-4: Fetch Requirements
- [ ] User clicks "Fetch Details"
- [ ] List of Jira issues appears
- [ ] Issues can be selected/filtered
- [ ] Selected issues passed to LLM for generation

### TC-5: Network Timeout
- [ ] Jira instance is unreachable
- [ ] Error: "Unable to reach Jira instance"
- [ ] User can retry

---

## 🔄 Error Handling

| Error Code | Message | Cause | Fix |
|-----------|---------|-------|-----|
| 401 | Unauthorized | Invalid email or API token | Re-enter credentials |
| 404 | Project not found | Invalid project key | Check project key |
| 403 | Forbidden | User lacks permission | Grant project access in Jira |
| 500 | Server error | Jira service issue | Retry later |
| Network timeout | Unable to reach Jira | Network/firewall issue | Check connectivity |

---

## 📋 UI Components

### Page: `/connections/jira-integration`
- Form with URL, email, API token, project key
- Test Connection button
- Save button
- Status badge (Connected/Failed/Untested)
- Last tested timestamp
- Error message display

---

## 🚀 Success Criteria

✅ User can configure Jira connection  
✅ User can test connection before save  
✅ User can fetch Jira requirements  
✅ Requirements display in Test Plan/Case generators  
✅ API tokens stored securely  
✅ Clear error messages for troubleshooting  

---

## 📞 Related Documents

- Data Schema: See `gemini.md` § JiraConfig Payload
- Task Checklist: See `task_plan.md` § Jira Integration Module
- Progress: See `progress.md`

