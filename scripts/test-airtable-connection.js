#!/usr/bin/env node

/**
 * Test Airtable Connection and Data
 */

require('dotenv').config();
const Airtable = require('airtable');

const config = {
    airtable: {
        apiKey: process.env.AIRTABLE_API_KEY,
        baseId: process.env.AIRTABLE_BASE_ID,
        tableId: process.env.AIRTABLE_TABLE_ID || 'tblq3cgwhhPPjffEi',
        viewId: process.env.AIRTABLE_VIEW_ID || 'viw17thlqxwsSvaVF',
        tableName: process.env.AIRTABLE_TABLE_NAME || 'Jail Records'
    }
};

async function testAirtableConnection() {
    console.log('🔍 Testing Airtable Connection...');
    console.log('=====================================\n');

    console.log('📋 Configuration:');
    console.log(`   API Key: ${config.airtable.apiKey ? config.airtable.apiKey.substring(0, 15) + '...' : 'NOT SET'}`);
    console.log(`   Base ID: ${config.airtable.baseId || 'NOT SET'}`);
    console.log(`   Table Name: ${config.airtable.tableName}`);
    console.log(`   View ID: ${config.airtable.viewId}\n`);

    if (!config.airtable.apiKey || !config.airtable.baseId) {
        console.log('❌ Missing Airtable credentials!');
        return;
    }

    try {
        const airtable = new Airtable({ apiKey: config.airtable.apiKey });
        const base = airtable.base(config.airtable.baseId);
        const table = base(config.airtable.tableName);
        
        console.log('🔍 Testing basic table access...');
        
        // Try to get a few records to test access
        const records = await table.select({
            maxRecords: 5
        }).all();

        console.log(`✅ Successfully connected! Found ${records.length} records.`);
        
        if (records.length > 0) {
            console.log('\n📋 Sample record structure:');
            const sampleRecord = records[0];
            console.log(`   Record ID: ${sampleRecord.id}`);
            console.log(`   Fields: ${Object.keys(sampleRecord.fields).join(', ')}`);
            
            console.log('\n📊 All available fields in your table:');
            const allFields = new Set();
            records.forEach(record => {
                Object.keys(record.fields).forEach(field => allFields.add(field));
            });
            Array.from(allFields).sort().forEach(field => {
                console.log(`   - ${field}`);
            });
            
            console.log('\n📅 Testing date-based filtering...');
            const testDates = ['2024-12-19', '2024-12-18', '2024-12-17', '2023-12-19'];
            
            for (const testDate of testDates) {
                try {
                    const dateRecords = await table.select({
                        filterByFormula: `IS_SAME({Booking Date}, DATEVALUE("${testDate}"), "day")`,
                        maxRecords: 10
                    }).all();
                    
                    console.log(`   ${testDate}: ${dateRecords.length} records`);
                    
                    if (dateRecords.length > 0) {
                        console.log(`     Sample: ${dateRecords[0].fields['First Name']} ${dateRecords[0].fields['Last Name']}`);
                    }
                } catch (error) {
                    console.log(`   ${testDate}: Error - ${error.message}`);
                }
            }
        } else {
            console.log('⚠️  No records found in table');
        }

    } catch (error) {
        console.error('❌ Error accessing Airtable:', error.message);
        
        if (error.message.includes('NOT_FOUND')) {
            console.log('\n💡 This usually means:');
            console.log('   1. The base ID is incorrect');
            console.log('   2. The table name is incorrect');
            console.log('   3. The API key doesn\'t have access to this base');
        } else if (error.message.includes('UNAUTHORIZED') || error.message.includes('not authorized')) {
            console.log('\n💡 This usually means:');
            console.log('   1. The API key is invalid or expired');
            console.log('   2. The API key doesn\'t have the required permissions');
            console.log('   3. The API key wasn\'t granted access to this specific base');
        }
    }
}

testAirtableConnection().catch(console.error);