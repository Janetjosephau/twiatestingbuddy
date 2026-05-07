# Testing Buddy AI - Connectivity Test Tools

This directory contains utilities to test connectivity to all external services required by the Testing Buddy AI system.

## 📋 Available Tools

### 1. LLM Connectivity Tester (`test-llm-connectivity.js`)
Tests connection to various LLM providers.

```bash
# Test all providers
node test-llm-connectivity.js all sk-openai-key your-gemini-key your-grok-key

# Test specific provider
node test-llm-connectivity.js openai sk-your-openai-key
node test-llm-connectivity.js ollama  # (no key needed for local)
```

**Supported Providers:**
- OpenAI
- Google Gemini
- Ollama (local)
- LM Studio (local)
- Grok (xAI)

### 2. Jira Connectivity Tester (`test-jira-connectivity.js`)
Tests connection to Jira Cloud instance.

```bash
# Basic connectivity test
node test-jira-connectivity.js https://company.atlassian.net user@company.com api-token-here

# Test with specific project
node test-jira-connectivity.js https://company.atlassian.net user@company.com api-token-here PROJ
```

### 3. PostgreSQL Connectivity Tester (`test-postgres-connectivity.js`)
Tests connection to PostgreSQL database.

```bash
# Basic connectivity
node test-postgres-connectivity.js localhost 5432 testingbuddy_db postgres mypassword

# With Prisma compatibility test
node test-postgres-connectivity.js localhost 5432 testingbuddy_db postgres mypassword --prisma
```

### 4. Rally/TestLink Connectivity Tester (`test-rally-connectivity.js`)
Tests connection to Rally or TestLink instances.

```bash
# Test Rally
node test-rally-connectivity.js rally your-api-key-here _workspace-id

# Test TestLink
node test-rally-connectivity.js testlink https://testlink.company.com your-api-key
```

### 5. Master Test Runner (`run-connectivity-tests.js`)
Runs all connectivity tests at once.

```bash
# Run with config file
node run-connectivity-tests.js connectivity-config.json

# Run with environment variables (no config file needed)
node run-connectivity-tests.js
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd tools
npm init -y
npm install pg
```

### 2. Configure Credentials

1. Copy the template configuration:
   ```bash
   cp connectivity-config-template.json connectivity-config.json
   ```

2. Edit `connectivity-config.json` with your actual credentials:
   ```json
   {
     "llm": {
       "openaiApiKey": "sk-your-actual-openai-key"
     },
     "jira": {
       "instanceUrl": "https://yourcompany.atlassian.net",
       "email": "your-email@company.com",
       "apiToken": "your-actual-jira-token"
     }
     // ... etc
   }
   ```

### 3. Set Environment Variables (Alternative)

Instead of using a config file, you can set environment variables:

```bash
export OPENAI_API_KEY="sk-your-key"
export JIRA_INSTANCE_URL="https://company.atlassian.net"
export JIRA_EMAIL="user@company.com"
export JIRA_API_TOKEN="your-token"
export POSTGRES_HOST="localhost"
export POSTGRES_DATABASE="testingbuddy_db"
export POSTGRES_USERNAME="postgres"
export POSTGRES_PASSWORD="your-password"
```

## 🔑 Getting API Credentials

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### Google Gemini
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key

### Jira
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create a new API token
3. Copy the token
4. Get your instance URL from Jira (e.g., `https://company.atlassian.net`)

### Rally
1. Go to https://rally1.rallydev.com/login
2. Go to API Keys section in your profile
3. Generate a new API key
4. Copy the key and workspace ID

### PostgreSQL
- Use your database connection details
- Default host: `localhost`
- Default port: `5432`

## 📊 Test Results

All tests generate detailed output showing:
- ✅ Connection status
- 📊 Available resources (models, projects, etc.)
- ❌ Error details if connection fails

The master test runner (`run-connectivity-tests.js`) also saves results to a timestamped JSON file for later analysis.

## 🚀 Next Steps

Once all connectivity tests pass:
1. ✅ Phase 2 (Link) is complete
2. Proceed to Phase 3 (Architect) - Backend development
3. Set up NestJS/Express server
4. Implement API endpoints
5. Connect frontend to backend

## ⚠️ Security Notes

- Never commit `connectivity-config.json` to version control
- Use environment variables in production
- Rotate API keys regularly
- Store credentials securely