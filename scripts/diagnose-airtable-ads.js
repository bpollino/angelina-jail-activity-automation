const axios = require('axios');
require('dotenv').config();

async function diagnoseAirtableBase() {
    console.log('🔍 Diagnosing Airtable Advertisement Base');
    console.log('=====================================\n');

    const AIRTABLE_API_KEY = process.env.AIRTABLE_AD_API_KEY || process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_AD_BASE_ID || process.env.AIRTABLE_BASE_ID;

    console.log('📋 Configuration:');
    console.log(`   API Key: ${AIRTABLE_API_KEY ? AIRTABLE_API_KEY.substring(0, 15) + '...' : 'NOT SET'}`);
    console.log(`   Base ID: ${AIRTABLE_BASE_ID || 'NOT SET'}\n`);

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
        console.log('❌ Missing Airtable credentials!');
        console.log('   Please ensure AIRTABLE_AD_API_KEY and AIRTABLE_AD_BASE_ID are set in .env file\n');
        return;
    }

    try {
        // First, let's try to get the base metadata
        console.log('🔍 Testing base access...');
        
        // Try to list all tables in the base
        const metaResponse = await axios.get(
            `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
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

        // Check if we have the required "Advertisements" table
        const adsTable = metaResponse.data.tables.find(table => table.name === 'Advertisements');
        
        if (adsTable) {
            console.log('✅ Found "Advertisements" table!');
            
            // Check for required fields
            const requiredFields = [
                'Title', 'Advertiser Name', 'Email', 'Ad Image', 
                'Target URL', 'Ad Description', 'Status', 'Start Date', 'End Date'
            ];
            
            const existingFields = adsTable.fields.map(f => f.name);
            const missingFields = requiredFields.filter(field => !existingFields.includes(field));
            
            if (missingFields.length === 0) {
                console.log('✅ All required fields present!');
            } else {
                console.log('⚠️  Missing required fields:');
                missingFields.forEach(field => console.log(`   - ${field}`));
            }

            // Check for "Active Ads" view
            const activeAdsView = adsTable.views?.find(view => view.name === 'Active Ads');
            if (activeAdsView) {
                console.log('✅ Found "Active Ads" view!');
            } else {
                console.log('⚠️  Missing "Active Ads" view');
                if (adsTable.views && adsTable.views.length > 0) {
                    console.log('   Available views:', adsTable.views.map(v => v.name).join(', '));
                }
            }

            // Try to fetch records from Advertisements table
            console.log('\n🔍 Testing record access...');
            const recordsResponse = await axios.get(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Advertisements`,
                {
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        maxRecords: 3
                    }
                }
            );

            console.log(`✅ Successfully fetched records! Found ${recordsResponse.data.records.length} records.`);
            
            if (recordsResponse.data.records.length > 0) {
                console.log('\n📋 Sample record structure:');
                const sampleRecord = recordsResponse.data.records[0];
                console.log(`   Record ID: ${sampleRecord.id}`);
                console.log(`   Fields: ${Object.keys(sampleRecord.fields).join(', ')}`);
            } else {
                console.log('ℹ️  No records found in table (this is normal for a new base)');
            }

        } else {
            console.log('❌ "Advertisements" table not found!');
            console.log('\n📝 You need to create an "Advertisements" table with the required fields.');
            console.log('   See AIRTABLE_AD_SCHEMA.md for detailed setup instructions.');
        }

    } catch (error) {
        console.error('❌ Error accessing Airtable:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            console.log('\n💡 This usually means:');
            console.log('   1. The base ID is incorrect');
            console.log('   2. The API key doesn\'t have access to this base');
            console.log('   3. The base was deleted or moved');
        } else if (error.response?.status === 401) {
            console.log('\n💡 This usually means:');
            console.log('   1. The API key is invalid or expired');
            console.log('   2. The API key doesn\'t have the required permissions');
        } else if (error.response?.status === 422) {
            console.log('\n💡 This usually means:');
            console.log('   1. The table "Advertisements" doesn\'t exist');
            console.log('   2. The view "Active Ads" doesn\'t exist');
            console.log('   3. Required fields are missing from the table');
        }
    }
}

// Run the diagnosis
diagnoseAirtableBase().catch(console.error);