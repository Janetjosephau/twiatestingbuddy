#!/usr/bin/env node

/**
 * PostgreSQL Connectivity Test Utility
 * Tests connection to PostgreSQL database
 *
 * Usage: node test-postgres-connectivity.js [host] [port] [database] [username] [password]
 * Example: node test-postgres-connectivity.js localhost 5432 testingbuddy_db postgres mypassword
 */

const { Client } = require('pg');

class PostgresConnectivityTester {
    constructor() {
        this.client = null;
    }

    setCredentials(host, port, database, username, password) {
        this.client = new Client({
            host: host,
            port: parseInt(port) || 5432,
            database: database,
            user: username,
            password: password,
            connectionTimeoutMillis: 10000, // 10 second timeout
            query_timeout: 10000
        });
    }

    async testConnection() {
        if (!this.client) {
            throw new Error('Credentials not set. Use setCredentials() first.');
        }

        console.log('🔍 Testing PostgreSQL connectivity...');
        console.log(`📍 Host: ${this.client.host}:${this.client.port}`);
        console.log(`🗄️  Database: ${this.client.database}`);
        console.log(`👤 User: ${this.client.user}`);

        try {
            // Connect to database
            console.log('\n1️⃣ Testing connection...');
            await this.client.connect();
            console.log('✅ Database connection established');

            // Test basic query
            console.log('\n2️⃣ Testing basic query...');
            const versionResult = await this.client.query('SELECT version()');
            const version = versionResult.rows[0].version;
            console.log(`✅ PostgreSQL version: ${version.split(' ')[1]}`);

            // Test database info
            console.log('\n3️⃣ Testing database information...');
            const dbResult = await this.client.query('SELECT current_database(), current_user');
            const dbName = dbResult.rows[0].current_database;
            const dbUser = dbResult.rows[0].current_user;
            console.log(`✅ Connected to database: ${dbName} as user: ${dbUser}`);

            // Test table listing (if possible)
            console.log('\n4️⃣ Testing table access...');
            const tablesResult = await this.client.query(`
                SELECT schemaname, tablename
                FROM pg_tables
                WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                LIMIT 5
            `);
            console.log(`✅ Found ${tablesResult.rows.length} tables in user schemas`);

            if (tablesResult.rows.length > 0) {
                console.log('📋 Sample tables:');
                tablesResult.rows.forEach(row => {
                    console.log(`   - ${row.schemaname}.${row.tablename}`);
                });
            }

            console.log('\n🎉 All PostgreSQL connectivity tests passed!');
            return {
                success: true,
                version: version.split(' ')[1],
                database: dbName,
                user: dbUser,
                tablesCount: tablesResult.rows.length
            };

        } catch (error) {
            console.log(`\n❌ PostgreSQL connection failed: ${error.message}`);
            return { success: false, error: error.message };
        } finally {
            if (this.client) {
                await this.client.end();
            }
        }
    }

    async testPrismaCompatibility() {
        if (!this.client) {
            throw new Error('Credentials not set. Use setCredentials() first.');
        }

        console.log('🔍 Testing Prisma compatibility...');

        try {
            await this.client.connect();

            // Test if we can create a test table (Prisma migration style)
            console.log('\n1️⃣ Testing table creation...');
            await this.client.query(`
                CREATE TEMP TABLE IF NOT EXISTS _prisma_test (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Table creation successful');

            // Test insert
            console.log('\n2️⃣ Testing data insertion...');
            const insertResult = await this.client.query(`
                INSERT INTO _prisma_test (name) VALUES ($1) RETURNING id
            `, ['test_record']);
            console.log(`✅ Data insertion successful (ID: ${insertResult.rows[0].id})`);

            // Test select
            console.log('\n3️⃣ Testing data retrieval...');
            const selectResult = await this.client.query('SELECT * FROM _prisma_test');
            console.log(`✅ Data retrieval successful (${selectResult.rows.length} records)`);

            // Test update
            console.log('\n4️⃣ Testing data update...');
            await this.client.query(`
                UPDATE _prisma_test SET name = $1 WHERE id = $2
            `, ['updated_test_record', insertResult.rows[0].id]);
            console.log('✅ Data update successful');

            // Test delete
            console.log('\n5️⃣ Testing data deletion...');
            await this.client.query('DELETE FROM _prisma_test WHERE id = $1', [insertResult.rows[0].id]);
            console.log('✅ Data deletion successful');

            console.log('\n🎉 Prisma compatibility tests passed!');
            return { success: true };

        } catch (error) {
            console.log(`\n❌ Prisma compatibility test failed: ${error.message}`);
            return { success: false, error: error.message };
        } finally {
            if (this.client) {
                await this.client.end();
            }
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('🐘 PostgreSQL Connectivity Test Utility');
        console.log('======================================');
        console.log('');
        console.log('Usage:');
        console.log('  node test-postgres-connectivity.js [host] [port] [database] [username] [password]');
        console.log('  node test-postgres-connectivity.js [host] [port] [database] [username] [password] --prisma');
        console.log('');
        console.log('Examples:');
        console.log('  node test-postgres-connectivity.js localhost 5432 testingbuddy_db postgres mypassword');
        console.log('  node test-postgres-connectivity.js localhost 5432 testingbuddy_db postgres mypassword --prisma');
        console.log('');
        console.log('Note: Install pg driver first: npm install pg');
        return;
    }

    const params = args.filter(arg => !arg.startsWith('--'));
    const flags = args.filter(arg => arg.startsWith('--'));

    const [host, port, database, username, password] = params;
    const testPrisma = flags.includes('--prisma');

    if (!host || !database || !username || !password) {
        console.error('❌ Error: host, database, username, and password are required');
        process.exit(1);
    }

    const tester = new PostgresConnectivityTester();
    tester.setCredentials(host, port || 5432, database, username, password);

    try {
        // Test basic connectivity
        const result = await tester.testConnection();

        if (!result.success) {
            console.log('💥 Basic connectivity test failed!');
            process.exit(1);
        }

        // Test Prisma compatibility if requested
        if (testPrisma) {
            console.log('\n🔍 Running Prisma compatibility tests...');
            const prismaResult = await tester.testPrismaCompatibility();

            if (!prismaResult.success) {
                console.log('💥 Prisma compatibility test failed!');
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

module.exports = PostgresConnectivityTester;