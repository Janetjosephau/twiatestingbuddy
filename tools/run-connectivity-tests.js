#!/usr/bin/env node

/**
 * Master Connectivity Test Runner
 * Runs all connectivity tests for the Testing Buddy AI system
 *
 * Usage: node run-connectivity-tests.js [configFile]
 * Example: node run-connectivity-tests.js config.json
 */

const fs = require('fs');
const path = require('path');

class ConnectivityTestRunner {
    constructor() {
        this.results = {};
        this.config = {};
    }

    async loadConfig(configFile) {
        try {
            const configPath = path.resolve(configFile);
            const configData = fs.readFileSync(configPath, 'utf8');
            this.config = JSON.parse(configData);
            console.log(`✅ Loaded configuration from ${configPath}`);
        } catch (error) {
            console.log(`⚠️  No config file found or invalid. Using environment variables or manual input.`);
            console.log(`   Error: ${error.message}`);
            this.config = {};
        }
    }

    async runAllTests() {
        console.log('🚀 Testing Buddy AI - Connectivity Test Suite');
        console.log('==============================================\n');

        // Test LLM Providers
        await this.testLLMProviders();

        // Test Jira
        await this.testJira();

        // Test PostgreSQL
        await this.testPostgreSQL();

        // Test Rally/TestLink
        await this.testRallyTestLink();

        // Generate report
        this.generateReport();
    }

    async testLLMProviders() {
        console.log('🤖 Testing LLM Providers...');
        console.log('===========================\n');

        const LLMConnectivityTester = require('./test-llm-connectivity.js');
        const tester = new LLMConnectivityTester();

        const credentials = {
            openai: this.config.openaiApiKey || process.env.OPENAI_API_KEY,
            gemini: this.config.geminiApiKey || process.env.GEMINI_API_KEY,
            grok: this.config.grokApiKey || process.env.GROK_API_KEY
        };

        this.results.llm = await tester.testAllProviders(credentials);
        console.log('');
    }

    async testJira() {
        console.log('🎫 Testing Jira Connectivity...');
        console.log('===============================\n');

        const JiraConnectivityTester = require('./test-jira-connectivity.js');
        const tester = new JiraConnectivityTester();

        const instanceUrl = this.config.jiraInstanceUrl || process.env.JIRA_INSTANCE_URL;
        const email = this.config.jiraEmail || process.env.JIRA_EMAIL;
        const apiToken = this.config.jiraApiToken || process.env.JIRA_API_TOKEN;
        const projectKey = this.config.jiraProjectKey || process.env.JIRA_PROJECT_KEY;

        if (instanceUrl && email && apiToken) {
            tester.setCredentials(instanceUrl, email, apiToken);

            const result = await tester.testConnection();
            this.results.jira = { basic: result };

            if (result.success && projectKey) {
                const projectResult = await tester.testProjectAccess(projectKey);
                this.results.jira.project = projectResult;
            }
        } else {
            console.log('⏭️  Skipping Jira tests - credentials not provided');
            this.results.jira = { basic: { success: false, error: 'Credentials not provided' } };
        }

        console.log('');
    }

    async testPostgreSQL() {
        console.log('🐘 Testing PostgreSQL Connectivity...');
        console.log('=====================================\n');

        const PostgresConnectivityTester = require('./test-postgres-connectivity.js');
        const tester = new PostgresConnectivityTester();

        const host = this.config.postgresHost || process.env.POSTGRES_HOST || 'localhost';
        const port = this.config.postgresPort || process.env.POSTGRES_PORT || 5432;
        const database = this.config.postgresDatabase || process.env.POSTGRES_DATABASE;
        const username = this.config.postgresUsername || process.env.POSTGRES_USERNAME;
        const password = this.config.postgresPassword || process.env.POSTGRES_PASSWORD;

        if (database && username && password) {
            tester.setCredentials(host, port, database, username, password);

            const result = await tester.testConnection();
            this.results.postgres = { basic: result };

            if (result.success) {
                const prismaResult = await tester.testPrismaCompatibility();
                this.results.postgres.prisma = prismaResult;
            }
        } else {
            console.log('⏭️  Skipping PostgreSQL tests - credentials not provided');
            this.results.postgres = { basic: { success: false, error: 'Credentials not provided' } };
        }

        console.log('');
    }

    async testRallyTestLink() {
        console.log('🎯 Testing Rally/TestLink Connectivity...');
        console.log('=========================================\n');

        const { RallyConnectivityTester, TestLinkConnectivityTester } = require('./test-rally-connectivity.js');

        // Test Rally
        const rallyApiKey = this.config.rallyApiKey || process.env.RALLY_API_KEY;
        const rallyWorkspaceId = this.config.rallyWorkspaceId || process.env.RALLY_WORKSPACE_ID;

        if (rallyApiKey) {
            const rallyTester = new RallyConnectivityTester();
            rallyTester.setCredentials(rallyApiKey, rallyWorkspaceId);
            this.results.rally = await rallyTester.testConnection();
        } else {
            console.log('⏭️  Skipping Rally tests - API key not provided');
            this.results.rally = { success: false, error: 'API key not provided' };
        }

        // Test TestLink
        const testlinkUrl = this.config.testlinkUrl || process.env.TESTLINK_URL;
        const testlinkApiKey = this.config.testlinkApiKey || process.env.TESTLINK_API_KEY;

        if (testlinkUrl && testlinkApiKey) {
            const testlinkTester = new TestLinkConnectivityTester();
            testlinkTester.setCredentials(testlinkUrl, testlinkApiKey);
            this.results.testlink = await testlinkTester.testConnection();
        } else {
            console.log('⏭️  Skipping TestLink tests - credentials not provided');
            this.results.testlink = { success: false, error: 'Credentials not provided' };
        }

        console.log('');
    }

    generateReport() {
        console.log('📊 CONNECTIVITY TEST REPORT');
        console.log('===========================\n');

        const summary = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0
        };

        // LLM Results
        console.log('🤖 LLM PROVIDERS:');
        Object.entries(this.results.llm || {}).forEach(([provider, result]) => {
            summary.total++;
            const status = result.success ? '✅' : '❌';
            const message = result.success ? 'Connected' : (result.error || 'Failed');
            console.log(`  ${status} ${provider}: ${message}`);
            if (result.success) summary.passed++;
            else if (result.error === 'No API key provided') summary.skipped++;
            else summary.failed++;
        });

        // Jira Results
        console.log('\n🎫 JIRA:');
        if (this.results.jira?.basic) {
            summary.total++;
            const status = this.results.jira.basic.success ? '✅' : '❌';
            const message = this.results.jira.basic.success ? 'Connected' : (this.results.jira.basic.error || 'Failed');
            console.log(`  ${status} Basic connectivity: ${message}`);
            if (this.results.jira.basic.success) summary.passed++;
            else if (this.results.jira.basic.error === 'Credentials not provided') summary.skipped++;
            else summary.failed++;
        }

        if (this.results.jira?.project) {
            summary.total++;
            const status = this.results.jira.project.success ? '✅' : '❌';
            const message = this.results.jira.project.success ? 'Project accessible' : (this.results.jira.project.error || 'Failed');
            console.log(`  ${status} Project access: ${message}`);
            if (this.results.jira.project.success) summary.passed++;
            else summary.failed++;
        }

        // PostgreSQL Results
        console.log('\n🐘 POSTGRESQL:');
        if (this.results.postgres?.basic) {
            summary.total++;
            const status = this.results.postgres.basic.success ? '✅' : '❌';
            const message = this.results.postgres.basic.success ? 'Connected' : (this.results.postgres.basic.error || 'Failed');
            console.log(`  ${status} Basic connectivity: ${message}`);
            if (this.results.postgres.basic.success) summary.passed++;
            else if (this.results.postgres.basic.error === 'Credentials not provided') summary.skipped++;
            else summary.failed++;
        }

        if (this.results.postgres?.prisma) {
            summary.total++;
            const status = this.results.postgres.prisma.success ? '✅' : '❌';
            const message = this.results.postgres.prisma.success ? 'Prisma compatible' : (this.results.postgres.prisma.error || 'Failed');
            console.log(`  ${status} Prisma compatibility: ${message}`);
            if (this.results.postgres.prisma.success) summary.passed++;
            else summary.failed++;
        }

        // Rally/TestLink Results
        console.log('\n🎯 RALLY/TESTLINK:');
        if (this.results.rally) {
            summary.total++;
            const status = this.results.rally.success ? '✅' : '❌';
            const message = this.results.rally.success ? 'Connected' : (this.results.rally.error || 'Failed');
            console.log(`  ${status} Rally: ${message}`);
            if (this.results.rally.success) summary.passed++;
            else if (this.results.rally.error === 'API key not provided') summary.skipped++;
            else summary.failed++;
        }

        if (this.results.testlink) {
            summary.total++;
            const status = this.results.testlink.success ? '✅' : '❌';
            const message = this.results.testlink.success ? 'Connected' : (this.results.testlink.error || 'Failed');
            console.log(`  ${status} TestLink: ${message}`);
            if (this.results.testlink.success) summary.passed++;
            else if (this.results.testlink.error === 'Credentials not provided') summary.skipped++;
            else summary.failed++;
        }

        // Summary
        console.log('\n📈 SUMMARY:');
        console.log(`  Total Tests: ${summary.total}`);
        console.log(`  ✅ Passed: ${summary.passed}`);
        console.log(`  ❌ Failed: ${summary.failed}`);
        console.log(`  ⏭️  Skipped: ${summary.skipped}`);

        const successRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
        console.log(`  📊 Success Rate: ${successRate}%`);

        if (summary.failed === 0 && summary.skipped === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Ready to proceed to Phase 3.');
        } else if (summary.failed === 0) {
            console.log('\n⚠️  All configured services are working, but some tests were skipped due to missing credentials.');
        } else {
            console.log('\n💥 Some tests failed. Please check your configuration and credentials.');
        }

        // Save results to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFile = `connectivity-test-results-${timestamp}.json`;
        fs.writeFileSync(reportFile, JSON.stringify({
            timestamp: new Date().toISOString(),
            results: this.results,
            summary
        }, null, 2));
        console.log(`\n💾 Results saved to: ${reportFile}`);
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const configFile = args[0] || 'connectivity-config.json';

    const runner = new ConnectivityTestRunner();

    // Try to load config file
    await runner.loadConfig(configFile);

    // Run all tests
    await runner.runAllTests();
}

if (require.main === module) {
    main().catch(error => {
        console.error(`💥 Fatal error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = ConnectivityTestRunner;