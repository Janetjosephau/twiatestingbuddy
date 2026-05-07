#!/usr/bin/env node

/**
 * LLM Connectivity Test Utility
 * Tests connection to various LLM providers
 *
 * Usage: node test-llm-connectivity.js [provider] [apiKey]
 * Example: node test-llm-connectivity.js openai sk-your-key-here
 */

const https = require('https');
const http = require('http');

class LLMConnectivityTester {
    constructor() {
        this.providers = {
            openai: {
                name: 'OpenAI',
                endpoint: 'https://api.openai.com/v1/models',
                method: 'GET',
                headers: (apiKey) => ({
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }),
                testPayload: null,
                successCheck: (response) => response.data && Array.isArray(response.data)
            },
            gemini: {
                name: 'Google Gemini',
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models?key=',
                method: 'GET',
                headers: () => ({
                    'Content-Type': 'application/json'
                }),
                testPayload: null,
                successCheck: (response) => response.models && Array.isArray(response.models)
            },
            ollama: {
                name: 'Ollama (Local)',
                endpoint: 'http://localhost:11434/api/tags',
                method: 'GET',
                headers: () => ({
                    'Content-Type': 'application/json'
                }),
                testPayload: null,
                successCheck: (response) => response.models && Array.isArray(response.models)
            },
            lmstudio: {
                name: 'LM Studio (Local)',
                endpoint: 'http://localhost:1234/v1/models',
                method: 'GET',
                headers: () => ({
                    'Content-Type': 'application/json'
                }),
                testPayload: null,
                successCheck: (response) => response.data && Array.isArray(response.data)
            },
            grok: {
                name: 'Grok (xAI)',
                endpoint: 'https://api.x.ai/v1/models',
                method: 'GET',
                headers: (apiKey) => ({
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }),
                testPayload: null,
                successCheck: (response) => response.models && Array.isArray(response.models)
            }
        };
    }

    async testConnection(provider, apiKey = null) {
        if (!this.providers[provider]) {
            throw new Error(`Unknown provider: ${provider}. Available: ${Object.keys(this.providers).join(', ')}`);
        }

        const config = this.providers[provider];
        let url = config.endpoint;

        // Handle API key in URL for Gemini
        if (provider === 'gemini' && apiKey) {
            url = `${config.endpoint}${apiKey}`;
        }

        console.log(`🔍 Testing ${config.name} connectivity...`);
        console.log(`📍 Endpoint: ${url}`);

        try {
            const response = await this.makeRequest(url, config, apiKey);

            if (config.successCheck(response)) {
                console.log(`✅ ${config.name} connection successful!`);
                console.log(`📊 Response contains ${Array.isArray(response.models || response.data) ? (response.models || response.data).length : 'unknown'} models`);
                return { success: true, response };
            } else {
                console.log(`❌ ${config.name} connection failed - unexpected response format`);
                console.log(`📄 Response:`, JSON.stringify(response, null, 2));
                return { success: false, error: 'Unexpected response format', response };
            }
        } catch (error) {
            console.log(`❌ ${config.name} connection failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    makeRequest(url, config, apiKey) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: config.method,
                headers: config.headers(apiKey)
            };

            const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (e) {
                        reject(new Error(`Invalid JSON response: ${data.substring(0, 200)}...`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`Request failed: ${err.message}`));
            });

            if (config.testPayload) {
                req.write(JSON.stringify(config.testPayload));
            }

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout after 10 seconds'));
            });

            req.end();
        });
    }

    async testAllProviders(credentials = {}) {
        console.log('🚀 Testing all LLM providers...\n');

        const results = {};
        for (const [provider, config] of Object.entries(this.providers)) {
            const apiKey = credentials[provider];
            if (provider === 'ollama' || provider === 'lmstudio') {
                // Local providers don't need API keys
                results[provider] = await this.testConnection(provider);
            } else if (apiKey) {
                results[provider] = await this.testConnection(provider, apiKey);
            } else {
                console.log(`⏭️  Skipping ${config.name} - no API key provided`);
                results[provider] = { success: false, error: 'No API key provided' };
            }
            console.log(''); // Empty line between tests
        }

        return results;
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const tester = new LLMConnectivityTester();

    if (args.length === 0) {
        console.log('🤖 LLM Connectivity Test Utility');
        console.log('================================');
        console.log('');
        console.log('Usage:');
        console.log('  node test-llm-connectivity.js [provider] [apiKey]');
        console.log('  node test-llm-connectivity.js all [openai_key] [gemini_key] [grok_key]');
        console.log('');
        console.log('Examples:');
        console.log('  node test-llm-connectivity.js openai sk-your-openai-key');
        console.log('  node test-llm-connectivity.js ollama  # (no key needed for local)');
        console.log('  node test-llm-connectivity.js all sk-openai-key your-gemini-key your-grok-key');
        console.log('');
        console.log('Available providers: openai, gemini, ollama, lmstudio, grok');
        return;
    }

    const [command, ...params] = args;

    try {
        if (command === 'all') {
            const [openaiKey, geminiKey, grokKey] = params;
            const credentials = {
                openai: openaiKey,
                gemini: geminiKey,
                grok: grokKey
            };
            const results = await tester.testAllProviders(credentials);

            console.log('📊 SUMMARY:');
            console.log('===========');
            Object.entries(results).forEach(([provider, result]) => {
                const status = result.success ? '✅' : '❌';
                console.log(`${status} ${tester.providers[provider].name}: ${result.success ? 'Connected' : result.error}`);
            });
        } else {
            const provider = command;
            const apiKey = params[0];
            const result = await tester.testConnection(provider, apiKey);

            if (result.success) {
                console.log('🎉 Test completed successfully!');
                process.exit(0);
            } else {
                console.log('💥 Test failed!');
                process.exit(1);
            }
        }
    } catch (error) {
        console.error(`💥 Error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = LLMConnectivityTester;