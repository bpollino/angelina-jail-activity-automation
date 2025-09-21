#!/usr/bin/env node

/**
 * Test Airtable Base Metadata Access
 */

require('dotenv').config();
const axios = require('axios');

const config = {
    airtable: {
        apiKey: process.env.AIRTABLE_API_KEY,
        baseId: process.env.AIRTABLE_BASE_ID
    }
};

async function testBaseMetadata() {
    console.log('🔍 Testing Airtable Base Metadata Access...');
    console.log('==========================================\n');

    console.log('📋 Configuration:');
    console.log(`   API Key: ${config.airtable.apiKey ? config.airtable.apiKey.substring(0, 15) + '...' : 'NOT SET'}`);
    console.log(`   Base ID: ${config.airtable.baseId || 'NOT SET'}\n`);

    if (!config.airtable.apiKey || !config.airtable.baseId) {
        console.log('❌ Missing Airtable credentials!');
        return;
    }

    try {
        console.log('🔍 Testing metadata endpoint...');
        
        // Try to get base metadata
        const metaResponse = await axios.get(
            `https://api.airtable.com/v0/meta/bases/${config.airtable.baseId}/tables`,
            {
                headers: {
                    'Authorization': `Bearer ${config.airtable.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Successfully connected to Airtable base!\n');
        console.log('📊 Tables found in base:');
        metaResponse.data.tables.forEach((table, index) => {
            console.log(`   ${index + 1}. ${table.name} (ID: ${table.id})`);
            console.log(`      Fields: ${table.fields.map(f => f.name).join(', ')}`);
            if (table.views && table.views.length > 0) {
                console.log(`      Views: ${table.views.map(v => v.name).join(', ')}`);
            }
            console.log('');
        });

        // Check for jail records table
        const jailTable = metaResponse.data.tables.find(table => 
            table.name.toLowerCase().includes('jail') || 
            table.name.toLowerCase().includes('record') ||
            table.id === 'tblq3cgwhhPPjffEi'
        );
        
        if (jailTable) {
            console.log(`✅ Found target table: "${jailTable.name}" (ID: ${jailTable.id})`);
            
            // Try to fetch some records
            console.log('\n🔍 Testing record access...');
            try {
                const recordsResponse = await axios.get(
                    `https://api.airtable.com/v0/${config.airtable.baseId}/${jailTable.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${config.airtable.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        params: {
                            maxRecords: 3
                        }
                    }
                );

                console.log(`✅ Successfully fetched ${recordsResponse.data.records.length} records!`);
                
                if (recordsResponse.data.records.length > 0) {
                    console.log('\n📋 Sample record:');
                    const sample = recordsResponse.data.records[0];
                    console.log(`   Record ID: ${sample.id}`);
                    console.log(`   Fields: ${Object.keys(sample.fields).join(', ')}`);
                    
                    // Show sample data
                    if (sample.fields['First Name'] || sample.fields['Last Name']) {
                        console.log(`   Sample Name: ${sample.fields['First Name']} ${sample.fields['Last Name']}`);
                    }
                    if (sample.fields['Booking Date']) {
                        console.log(`   Sample Date: ${sample.fields['Booking Date']}`);
                    }
                }
                
            } catch (recordError) {
                console.log(`❌ Error fetching records: ${recordError.response?.data?.error?.message || recordError.message}`);
            }
        } else {
            console.log('❌ Could not find jail records table');
        }

    } catch (error) {
        console.error('❌ Error accessing base metadata:');
        if (error.response?.data) {
            console.error('   Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('   Error:', error.message);
        }
    }
}

testBaseMetadata().catch(console.error);