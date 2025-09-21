require('dotenv').config();
const Airtable = require('airtable');

async function inspectRecord() {
    console.log('🔍 Inspecting Available Fields\n');
    
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_TABLE_ID;
    
    Airtable.configure({
        endpointUrl: 'https://api.airtable.com',
        apiKey: apiKey
    });
    
    try {
        const base = Airtable.base(baseId);
        const records = await base(tableId).select({ maxRecords: 3 }).firstPage();
        
        console.log(`📊 Found ${records.length} records\n`);
        
        if (records.length > 0) {
            const record = records[0];
            console.log('📋 Available Fields in First Record:');
            console.log('   Record ID:', record.id);
            
            const fields = Object.keys(record.fields);
            fields.forEach(field => {
                const value = record.get(field);
                const type = Array.isArray(value) ? 'Array' : typeof value;
                const preview = Array.isArray(value) ? `[${value.length} items]` : 
                              typeof value === 'string' && value.length > 50 ? 
                              value.substring(0, 50) + '...' : value;
                
                console.log(`   - "${field}": ${type} = ${preview}`);
            });
            
            console.log('\n🔍 Looking for Date Fields:');
            fields.forEach(field => {
                const value = record.get(field);
                if (typeof value === 'string' && (
                    value.includes('2023') || value.includes('2024') || value.includes('2025') ||
                    field.toLowerCase().includes('date') || field.toLowerCase().includes('time')
                )) {
                    console.log(`   📅 "${field}": ${value}`);
                }
            });
            
            console.log('\n🔍 Looking for Name/Identity Fields:');
            fields.forEach(field => {
                if (field.toLowerCase().includes('name') || 
                    field.toLowerCase().includes('first') || 
                    field.toLowerCase().includes('last')) {
                    const value = record.get(field);
                    console.log(`   👤 "${field}": ${value}`);
                }
            });
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

inspectRecord();