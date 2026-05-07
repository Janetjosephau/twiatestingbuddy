#!/usr/bin/env node

/**
 * Jira Connectivity Test Utility
 * Tests connection to Jira Cloud instance
 *
 * Usage: node test-jira-connectivity.js [instanceUrl] [email] [apiToken]
 * Example: node test-jira-connectivity.js https://yourcompany.atlassian.net user@company.com your-api-token
 */

const https = require('https');

class JiraConnectivityTester {
    constructor() {
        this.baseUrl = null;
        this.auth = null;
    }

    setCredentials(instanceUrl, email, apiToken) {
        this.baseUrl = instanceUrl.replace(/\/$/, ''); // Remove trailing slash
        this.auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    }

    async testConnection() {
        if (!this.baseUrl || !this.auth) {
            throw new Error('Credentials not set. Use setCredentials() first.');
        }

        console.log('🔍 Testing Jira Cloud connectivity...');
        console.log(`📍 Instance: ${this.baseUrl}`);
        console.log(`👤 User: ${this.auth ? 'Authenticated' : 'No auth'}`);

        try {
            // Test 1: Get server info
            console.log('\n1️⃣ Testing server info endpoint...');
            const serverInfo = await this.makeRequest('/rest/api/3/serverInfo', 'GET');
            console.log(`✅ Server info retrieved: ${serverInfo.serverTitle || 'Unknown'}`);

            // Test 2: Get current user
            console.log('\n2️⃣ Testing current user endpoint...');
            const currentUser = await this.makeRequest('/rest/api/3/myself', 'GET');
            console.log(`✅ Current user: ${currentUser.displayName} (${currentUser.emailAddress})`);

            // Test 3: Get projects (limited to 1 for speed)
            console.log('\n3️⃣ Testing projects endpoint...');
            const projects = await this.makeRequest('/rest/api/3/project?maxResults=1', 'GET');
            console.log(`✅ Found ${projects.total || projects.length || 0} projects (showing 1)`);

            // Test 4: Get issue types
            console.log('\n4️⃣ Testing issue types endpoint...');
            const issueTypes = await this.makeRequest('/rest/api/3/issuetype', 'GET');
            console.log(`✅ Found ${issueTypes.length} issue types`);

            console.log('\n🎉 All Jira connectivity tests passed!');
            return {
                success: true,
                serverInfo,
                currentUser,
                projectsCount: projects.total || projects.length,
                issueTypesCount: issueTypes.length
            };

        } catch (error) {
            console.log(`\n❌ Jira connection failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async testProjectAccess(projectKey) {
        if (!this.baseUrl || !this.auth) {
            throw new Error('Credentials not set. Use setCredentials() first.');
        }

        console.log(`🔍 Testing access to project: ${projectKey}`);

        try {
            // Get project details
            const project = await this.makeRequest(`/rest/api/3/project/${projectKey}`, 'GET');
            console.log(`✅ Project found: ${project.name} (${project.key})`);

            // Get project issues (limited to 1)
            const issues = await this.makeRequest(`/rest/api/3/search?jql=project=${projectKey}&maxResults=1`, 'GET');
            console.log(`✅ Found ${issues.total} issues in project`);

            return {
                success: true,
                project: {
                    key: project.key,
                    name: project.name,
                    issuesCount: issues.total
                }
            };

        } catch (error) {
            console.log(`❌ Project access test failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    makeRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}${endpoint}`;
            const urlObj = new URL(url);

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            const response = responseData ? JSON.parse(responseData) : {};
                            resolve(response);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                        }
                    } catch (e) {
                        reject(new Error(`Invalid JSON response: ${responseData.substring(0, 200)}...`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`Request failed: ${err.message}`));
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.setTimeout(15000, () => {
                req.destroy();
                reject(new Error('Request timeout after 15 seconds'));
            });

            req.end();
        });
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('🎫 Jira Connectivity Test Utility');
        console.log('==================================');
        console.log('');
        console.log('Usage:');
        console.log('  node test-jira-connectivity.js [instanceUrl] [email] [apiToken]');
        console.log('  node test-jira-connectivity.js [instanceUrl] [email] [apiToken] [projectKey]');
        console.log('');
        console.log('Examples:');
        console.log('  node test-jira-connectivity.js https://company.atlassian.net user@company.com api-token-here');
        console.log('  node test-jira-connectivity.js https://company.atlassian.net user@company.com api-token-here PROJ');
        console.log('');
        console.log('Note: Get your API token from https://id.atlassian.com/manage-profile/security/api-tokens');
        return;
    }

    const [instanceUrl, email, apiToken, projectKey] = args;

    if (!instanceUrl || !email || !apiToken) {
        console.error('❌ Error: instanceUrl, email, and apiToken are required');
        process.exit(1);
    }

    const tester = new JiraConnectivityTester();
    tester.setCredentials(instanceUrl, email, apiToken);

    try {
        // Test basic connectivity
        const result = await tester.testConnection();

        if (!result.success) {
            console.log('💥 Basic connectivity test failed!');
            process.exit(1);
        }

        // Test project access if project key provided
        if (projectKey) {
            console.log(`\n🔍 Testing project access for: ${projectKey}`);
            const projectResult = await tester.testProjectAccess(projectKey);

            if (!projectResult.success) {
                console.log('💥 Project access test failed!');
                process.exit(1);
            }
        }

        console.log('\n🎉 All tests completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error(`💥 Error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = JiraConnectivityTester;