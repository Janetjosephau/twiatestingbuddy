#!/usr/bin/env node

/**
 * Rally/TestLink Connectivity Test Utility
 * Tests connection to Rally or TestLink instances
 *
 * Usage for Rally: node test-rally-connectivity.js rally [apiKey] [workspaceId]
 * Usage for TestLink: node test-testlink-connectivity.js testlink [url] [apiKey]
 *
 * Examples:
 *   node test-rally-connectivity.js rally your-api-key-here _abc123def
 *   node test-testlink-connectivity.js testlink https://testlink.company.com your-api-key
 */

const https = require('https');
const http = require('http');

class RallyConnectivityTester {
    constructor() {
        this.baseUrl = 'https://rally1.rallydev.com/slm/webservice/v2.0';
        this.apiKey = null;
        this.workspaceId = null;
    }

    setCredentials(apiKey, workspaceId) {
        this.apiKey = apiKey;
        this.workspaceId = workspaceId;
    }

    async testConnection() {
        if (!this.apiKey) {
            throw new Error('API key not set. Use setCredentials() first.');
        }

        console.log('🔍 Testing Rally connectivity...');
        console.log(`📍 Base URL: ${this.baseUrl}`);
        console.log(`🔑 API Key: ${this.apiKey.substring(0, 8)}...`);
        console.log(`🏢 Workspace: ${this.workspaceId || 'Default'}`);

        try {
            // Test 1: Get user info
            console.log('\n1️⃣ Testing user authentication...');
            const userQuery = this.workspaceId
                ? `/user?workspace=${this.workspaceId}&fetch=ObjectID,Name,UserName`
                : '/user?fetch=ObjectID,Name,UserName';

            const userInfo = await this.makeRequest(userQuery);
            console.log(`✅ Authenticated as: ${userInfo.QueryResult.Results[0].Name} (${userInfo.QueryResult.Results[0].UserName})`);

            // Test 2: Get workspace info
            if (this.workspaceId) {
                console.log('\n2️⃣ Testing workspace access...');
                const workspaceInfo = await this.makeRequest(`/workspace/${this.workspaceId}?fetch=ObjectID,Name,State`);
                console.log(`✅ Workspace: ${workspaceInfo.Workspace.Name} (${workspaceInfo.Workspace.State})`);
            }

            // Test 3: Get projects
            console.log('\n3️⃣ Testing project access...');
            const projectQuery = this.workspaceId
                ? `/project?workspace=${this.workspaceId}&fetch=ObjectID,Name&pagesize=5`
                : '/project?fetch=ObjectID,Name&pagesize=5';

            const projects = await this.makeRequest(projectQuery);
            console.log(`✅ Found ${projects.QueryResult.TotalResultCount} projects (showing up to 5)`);

            // Test 4: Get test cases (if projects exist)
            if (projects.QueryResult.TotalResultCount > 0) {
                console.log('\n4️⃣ Testing test case access...');
                const firstProject = projects.QueryResult.Results[0];
                const testCaseQuery = `/testcase?project=${firstProject.ObjectID}&fetch=ObjectID,Name&pagesize=3`;
                const testCases = await this.makeRequest(testCaseQuery);
                console.log(`✅ Found ${testCases.QueryResult.TotalResultCount} test cases in project "${firstProject.Name}"`);
            }

            console.log('\n🎉 All Rally connectivity tests passed!');
            return {
                success: true,
                user: userInfo.QueryResult.Results[0],
                workspace: this.workspaceId,
                projectsCount: projects.QueryResult.TotalResultCount
            };

        } catch (error) {
            console.log(`\n❌ Rally connection failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    makeRequest(endpoint) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}${endpoint}`;
            const urlObj = new URL(url);

            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            const response = JSON.parse(data);
                            resolve(response);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                        }
                    } catch (e) {
                        reject(new Error(`Invalid JSON response: ${data.substring(0, 200)}...`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`Request failed: ${err.message}`));
            });

            req.setTimeout(15000, () => {
                req.destroy();
                reject(new Error('Request timeout after 15 seconds'));
            });

            req.end();
        });
    }
}

class TestLinkConnectivityTester {
    constructor() {
        this.baseUrl = null;
        this.apiKey = null;
    }

    setCredentials(baseUrl, apiKey) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.apiKey = apiKey;
    }

    async testConnection() {
        if (!this.baseUrl || !this.apiKey) {
            throw new Error('Credentials not set. Use setCredentials() first.');
        }

        console.log('🔍 Testing TestLink connectivity...');
        console.log(`📍 Base URL: ${this.baseUrl}`);
        console.log(`🔑 API Key: ${this.apiKey.substring(0, 8)}...`);

        try {
            // TestLink uses XML-RPC, but we'll test basic connectivity first
            console.log('\n1️⃣ Testing basic connectivity...');

            // Try to access the API endpoint
            const apiUrl = `${this.baseUrl}/lib/api/xmlrpc/v1/xmlrpc.php`;
            const isReachable = await this.testEndpointReachability(apiUrl);

            if (!isReachable) {
                throw new Error('TestLink API endpoint not reachable');
            }

            console.log('✅ TestLink API endpoint reachable');

            // Test 2: Try to get API info (if available)
            console.log('\n2️⃣ Testing API information...');
            try {
                const apiInfo = await this.makeXMLRPCRequest('tl.about');
                console.log(`✅ API Info: ${apiInfo || 'TestLink API available'}`);
            } catch (e) {
                console.log('⚠️  API info not available, but endpoint is reachable');
            }

            // Test 3: Try to get projects
            console.log('\n3️⃣ Testing project access...');
            try {
                const projects = await this.makeXMLRPCRequest('tl.getProjects');
                const projectCount = Array.isArray(projects) ? projects.length : 'unknown';
                console.log(`✅ Found ${projectCount} projects`);
            } catch (e) {
                console.log('⚠️  Project access test failed, but basic connectivity works');
            }

            console.log('\n🎉 TestLink connectivity test completed!');
            console.log('⚠️  Note: Full TestLink testing requires XML-RPC client library');
            return { success: true, note: 'Basic connectivity confirmed, full testing requires additional setup' };

        } catch (error) {
            console.log(`\n❌ TestLink connection failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    testEndpointReachability(url) {
        return new Promise((resolve) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 80,
                path: urlObj.pathname,
                method: 'HEAD'
            };

            const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
                resolve(res.statusCode >= 200 && res.statusCode < 400);
            });

            req.on('error', () => resolve(false));
            req.setTimeout(5000, () => {
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    makeXMLRPCRequest(method, params = []) {
        // Simplified XML-RPC request for basic testing
        return new Promise((resolve, reject) => {
            const xmlPayload = `<?xml version="1.0"?>
<methodCall>
<methodName>${method}</methodName>
<params>
<param><value><string>${this.apiKey}</string></value></param>
${params.map(p => `<param><value><string>${p}</string></value></param>`).join('')}
</params>
</methodCall>`;

            const url = `${this.baseUrl}/lib/api/xmlrpc/v1/xmlrpc.php`;
            const urlObj = new URL(url);

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 80,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml',
                    'Content-Length': Buffer.byteLength(xmlPayload)
                }
            };

            const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`Request failed: ${err.message}`));
            });

            req.write(xmlPayload);
            req.end();
        });
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('🎯 Rally/TestLink Connectivity Test Utility');
        console.log('===========================================');
        console.log('');
        console.log('Usage:');
        console.log('  Rally:    node test-rally-connectivity.js rally [apiKey] [workspaceId]');
        console.log('  TestLink: node test-rally-connectivity.js testlink [baseUrl] [apiKey]');
        console.log('');
        console.log('Examples:');
        console.log('  node test-rally-connectivity.js rally your-api-key-here _abc123def');
        console.log('  node test-rally-connectivity.js testlink https://testlink.company.com your-api-key');
        console.log('');
        console.log('Note: For Rally, get API key from https://rally1.rallydev.com/login');
        return;
    }

    const [system, ...params] = args;

    try {
        if (system === 'rally') {
            const [apiKey, workspaceId] = params;

            if (!apiKey) {
                console.error('❌ Error: API key is required for Rally');
                process.exit(1);
            }

            const tester = new RallyConnectivityTester();
            tester.setCredentials(apiKey, workspaceId);

            const result = await tester.testConnection();

            if (result.success) {
                console.log('\n🎉 Rally test completed successfully!');
                process.exit(0);
            } else {
                console.log('\n💥 Rally test failed!');
                process.exit(1);
            }

        } else if (system === 'testlink') {
            const [baseUrl, apiKey] = params;

            if (!baseUrl || !apiKey) {
                console.error('❌ Error: baseUrl and apiKey are required for TestLink');
                process.exit(1);
            }

            const tester = new TestLinkConnectivityTester();
            tester.setCredentials(baseUrl, apiKey);

            const result = await tester.testConnection();

            if (result.success) {
                console.log('\n🎉 TestLink test completed successfully!');
                process.exit(0);
            } else {
                console.log('\n💥 TestLink test failed!');
                process.exit(1);
            }

        } else {
            console.error(`❌ Error: Unknown system "${system}". Use "rally" or "testlink"`);
            process.exit(1);
        }

    } catch (error) {
        console.error(`💥 Error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { RallyConnectivityTester, TestLinkConnectivityTester };