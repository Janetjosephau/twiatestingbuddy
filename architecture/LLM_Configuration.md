# 🏗️ LLM Configuration Module - Architecture SOP

**Version:** 1.0  
**Created:** April 22, 2026  
**Status:** Phase 1 - Design Complete

---

## 📌 Module Overview

**Purpose:** Allow users to securely configure and test LLM provider connections (OpenAI, Gemini, Ollama, LMStudio, Grok).

**Owner:** System Pilot  
**Layer:** Layer 1 Architecture (SOP)

---

## 🎯 Goals

1. ✅ Support multiple LLM providers
2. ✅ Validate credentials before saving
3. ✅ Display connection status
4. ✅ Store configs securely in PostgreSQL
5. ✅ Allow edit/delete operations

---

## 📊 Input/Output Schemas

### Input Payload (Form)
```typescript
{
  provider: "openai" | "gemini" | "ollama" | "lmstudio" | "grok",
  name: string,                    // User-defined name (e.g., "GPT-4 Primary")
  apiKey: string,                  // Encrypted in DB
  apiUrl?: string,                 // For self-hosted (Ollama, LMStudio)
  model: string,                   // Provider-specific model name
  temperature?: number,            // 0.0 - 2.0
  maxTokens?: number,              // Max output tokens
}
```

### Output Payload (Saved Config)
```typescript
{
  id: uuid,
  provider: string,
  name: string,
  apiKey: string,                  // Encrypted
  apiUrl?: string,
  model: string,
  temperature: number,
  maxTokens: number,
  createdAt: ISO8601,
  lastTestedAt?: ISO8601,
  testStatus: "untested" | "connected" | "failed",
  testError?: string,
}
```

---

## 🔄 Functional Logic

### Use Case 1: Create New LLM Config

**Preconditions:**
- User is on LLM Configuration page
- At least one field filled

**Steps:**
1. User selects provider from dropdown
2. Provider dropdown auto-populates model options
3. User enters API Key, URL (if needed), model, parameters
4. User clicks "Test Connection"
   - Backend validates credentials with LLM API
   - If ✅ Success: Show "Connection Successful" message
   - If ❌ Failed: Show error message (e.g., "Invalid API Key")
5. User clicks "Save Configuration"
   - Backend encrypts API key
   - Backend stores config in `llm_configs` table
   - Show "Configuration Saved" message
   - Clear form
6. Config appears in sidebar or config list

**Error Handling:**
- Network timeout → "Unable to reach LLM provider"
- Invalid credentials → "Authentication failed"
- Unsupported model → "Model not available for this provider"

---

### Use Case 2: Edit Existing Config

**Preconditions:**
- Config exists in database
- User clicks "Edit" on a saved config

**Steps:**
1. Form pre-fills with existing values (API Key masked)
2. User modifies fields
3. User clicks "Test Connection" → same validation as Use Case 1
4. User clicks "Save Configuration" → Backend updates config
5. Show "Configuration Updated" message

---

### Use Case 3: Delete Config

**Preconditions:**
- Config exists

**Steps:**
1. User clicks "Delete"
2. Show confirmation dialog
3. Backend deletes config from database
4. If any test plans/cases reference this config:
   - Show warning: "This will mark dependent test plans as 'config_missing'"
   - Require double confirmation
5. Deletion complete

---

## 🔌 Connection Testing Logic

### Test Connection Endpoint

**Route:** `POST /api/llm/test-connection`

**Request:**
```json
{
  "provider": "openai",
  "apiKey": "sk-...",
  "apiUrl": null,
  "model": "gpt-4"
}
```

**Response (Success):**
```json
{
  "status": "connected",
  "provider": "openai",
  "model": "gpt-4",
  "message": "Connection Successful",
  "timestamp": "2026-04-22T12:00:00Z"
}
```

**Response (Failure):**
```json
{
  "status": "failed",
  "error": "Invalid API Key",
  "message": "Authentication failed",
  "timestamp": "2026-04-22T12:00:00Z"
}
```

---

## 💾 Database Schema

### Table: `llm_configs`
```sql
CREATE TABLE llm_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(500) NOT NULL, -- Encrypted with bcrypt/AES
  api_url VARCHAR(500),
  model VARCHAR(255) NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INT DEFAULT 2048,
  created_at TIMESTAMP DEFAULT NOW(),
  last_tested_at TIMESTAMP,
  test_status VARCHAR(50) DEFAULT 'untested',
  test_error TEXT,
  created_by_user_id UUID,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);
```

---

## 🛡️ Security Considerations

1. **API Key Encryption:**
   - Store encrypted with AES-256 or similar
   - Never expose in API responses (return null or masked value)

2. **Rate Limiting:**
   - Limit connection tests to 3 per minute
   - Prevent brute force attempts

3. **Secrets Management:**
   - Store encryption key in environment variable
   - Use `.env` file (not in version control)

4. **Audit Logging:**
   - Log all config creates/updates/deletes
   - Include user ID and timestamp

---

## 🧪 Test Cases

### TC-1: Create OpenAI Config
- [ ] User enters valid OpenAI API key
- [ ] Connection test succeeds
- [ ] Config saved to database
- [ ] Appears in config list

### TC-2: Create Ollama Config (Self-Hosted)
- [ ] User enters Ollama URL + model name
- [ ] Connection test verifies Ollama is reachable
- [ ] Config saved with custom URL

### TC-3: Invalid API Key
- [ ] User enters invalid API key
- [ ] Connection test fails with clear error
- [ ] User can retry

### TC-4: Edit Config
- [ ] User modifies temperature parameter
- [ ] Changes saved to database
- [ ] New value reflects in subsequent operations

### TC-5: Delete Config
- [ ] User deletes config
- [ ] Confirmation dialog shown
- [ ] Config removed from database
- [ ] Config removed from sidebar

---

## 🔄 Provider-Specific Logic

### OpenAI
- **Model Endpoint:** https://api.openai.com/v1/models
- **Test Endpoint:** https://api.openai.com/v1/chat/completions
- **Auth:** Bearer token in header
- **Models:** gpt-4, gpt-4-turbo, gpt-3.5-turbo

### Gemini
- **Model Endpoint:** https://generativelanguage.googleapis.com/v1/models
- **Test Endpoint:** Make lightweight API call
- **Auth:** API key in query parameter
- **Models:** gemini-pro, gemini-1.5-pro

### Ollama (Self-Hosted)
- **Model Endpoint:** http://localhost:11434/api/tags
- **Test Endpoint:** http://localhost:11434/api/generate
- **Auth:** None (local)
- **Models:** llama2, mistral, neural-chat, etc.

### LMStudio (Self-Hosted)
- **Model Endpoint:** http://localhost:1234/v1/models
- **Test Endpoint:** http://localhost:1234/v1/completions
- **Auth:** None (local)
- **Models:** Local model files

### Grok
- **Model Endpoint:** https://api.x.ai/v1/models
- **Test Endpoint:** https://api.x.ai/v1/chat/completions
- **Auth:** Bearer token
- **Models:** grok-1, grok-1.5

---

## 📋 UI Components

### Page: `/settings/llm-configuration`
- Form with provider dropdown
- Dynamic form fields based on provider selection
- Test Connection button
- Save button
- List of saved configs with edit/delete actions
- Status badge for each config (Connected/Failed/Untested)

---

## 🚀 Success Criteria

✅ User can add LLM config  
✅ User can test connection before save  
✅ User can edit existing config  
✅ User can delete config  
✅ Connection status displayed clearly  
✅ Error messages are helpful  
✅ API keys stored securely  

---

## 📞 Related Documents

- Data Schema: See `gemini.md` § LLMConfig Payload
- Task Checklist: See `task_plan.md` § LLM Configuration Module
- Progress: See `progress.md`

