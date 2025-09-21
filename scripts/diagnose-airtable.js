require('dotenv').config();
const Airtable = require('airtable');

async function diagnoseAirtable() {
    console.log('🔍 Airtable API Diagnostics\n');
    
    // Show configuration (without exposing full API key)
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_TABLE_ID;
    const viewId = process.env.AIRTABLE_VIEW_ID;
    
    console.log('📋 Configuration:');
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
    console.log(`   Base ID: ${baseId || 'NOT SET'}`);
    console.log(`   Table ID: ${tableId || 'NOT SET'}`);
    console.log(`   View ID: ${viewId || 'NOT SET'}`);
    
    if (!apiKey || !baseId) {
        console.log('\n❌ Missing required configuration');
        return;
    }
    
    // Test 1: Basic API connection
    console.log('\n🧪 Test 1: Basic API Connection');
    try {
        Airtable.configure({
            endpointUrl: 'https://api.airtable.com',
            apiKey: apiKey
        });
        
        const base = Airtable.base(baseId);
        console.log('   ✅ Airtable client configured');
        
        // Test 2: Try to access the table by name first
        console.log('\n🧪 Test 2: Access Table by Name');
        try {
            const records = await base('Jail Records').select({
                maxRecords: 1,
                view: 'Grid view' // Try default view first
            }).firstPage();
            
            console.log(`   ✅ Successfully accessed table by name`);
            console.log(`   📊 Found ${records.length} records`);
            
            if (records.length > 0) {
                console.log('\n📋 Available Fields:');
                const fields = Object.keys(records[0].fields);
                fields.forEach(field => console.log(`   - ${field}`));
            }
            
        } catch (error) {
            console.log(`   ❌ Table by name failed: ${error.message}`);
            
            // Test 3: Try to access by table ID
            console.log('\n🧪 Test 3: Access Table by ID');
            try {
                const records = await base(tableId).select({
                    maxRecords: 1
                }).firstPage();
                
                console.log(`   ✅ Successfully accessed table by ID`);
                console.log(`   📊 Found ${records.length} records`);
                
            } catch (idError) {
                console.log(`   ❌ Table by ID failed: ${idError.message}`);
            }
        }
        
    } catch (error) {
        console.log(`   ❌ Connection failed: ${error.message}`);
        
        if (error.message.includes('not authorized')) {
            console.log('\n💡 Authorization Troubleshooting:');
            console.log('   1. Verify your API token has access to this base');
            console.log('   2. Check if the base is in the correct workspace');
            console.log('   3. Ensure the token has "data.records:read" permission');
            console.log('   4. Try regenerating your API token in Airtable');
        }
    }
}

// Test different view access patterns
async function testViews() {
    console.log('\n🧪 Testing View Access...');
    
    try {
        const base = Airtable.base(process.env.AIRTABLE_BASE_ID);
        
        // Try different view patterns
        const viewTests = [
            { name: 'Default Grid View', view: 'Grid view' },
            { name: 'All Records', view: undefined },
            { name: 'Specific View ID', view: process.env.AIRTABLE_VIEW_ID }
        ];
        
        for (const test of viewTests) {
            try {
                console.log(`\n   Testing: ${test.name}`);
                const selectOptions = { maxRecords: 1 };
                if (test.view) {
                    selectOptions.view = test.view;
                }
                
                const records = await base('Jail Records').select(selectOptions).firstPage();
                console.log(`   ✅ ${test.name}: ${records.length} records`);
                
            } catch (error) {
                console.log(`   ❌ ${test.name}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.log(`   ❌ View testing failed: ${error.message}`);
    }
}

// Run diagnostics
diagnoseAirtable().then(() => {
    return testViews();
}).catch(error => {
    console.log(`\n💥 Diagnostic failed: ${error.message}`);
});