require('dotenv').config();
const Airtable = require('airtable');

async function debugData() {
    console.log('🔍 Debugging Real Data Issues\n');
    
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_TABLE_ID;
    
    Airtable.configure({
        endpointUrl: 'https://api.airtable.com',
        apiKey: apiKey
    });
    
    try {
        const base = Airtable.base(baseId);
        const records = await base(tableId).select({
            maxRecords: 3,
            sort: [{ field: 'Booking Date', direction: 'desc' }] // Get most recent
        }).firstPage();
        
        console.log(`📊 Found ${records.length} recent records\n`);
        
        records.forEach((record, index) => {
            console.log(`📋 Record ${index + 1}:`);
            console.log(`   ID: ${record.id}`);
            console.log(`   Name: ${record.get('Name')}`);
            console.log(`   Booking Date: ${record.get('Booking Date')}`);
            console.log(`   Age: ${record.get('Age')}`);
            
            // Check if there are city/state fields that might be named differently
            const allFields = Object.keys(record.fields);
            const cityStateFields = allFields.filter(field => 
                field.toLowerCase().includes('city') || 
                field.toLowerCase().includes('state') ||
                field.toLowerCase().includes('address') ||
                field.toLowerCase().includes('location') ||
                field.toLowerCase().includes('residence')
            );
            
            if (cityStateFields.length > 0) {
                console.log('   📍 Location Fields Found:');
                cityStateFields.forEach(field => {
                    console.log(`      ${field}: ${record.get(field)}`);
                });
            } else {
                console.log('   📍 No location fields found');
            }
            
            // Check bond amounts
            console.log(`   💰 Bond Amounts: "${record.get('Bond Amounts')}"`);
            console.log(`   ⚖️  Offenses: "${record.get('Offenses')}"`);
            
            // Check the raw booking date format
            const bookingDate = record.get('Booking Date');
            if (bookingDate) {
                console.log(`   📅 Raw Booking Date: "${bookingDate}" (type: ${typeof bookingDate})`);
                
                // Try to parse it
                const parsed = new Date(bookingDate);
                console.log(`   📅 Parsed Date: ${parsed.toISOString()}`);
                console.log(`   📅 Local Date: ${parsed.toLocaleDateString()}`);
            }
            
            console.log(''); // Empty line
        });
        
        // Test date filtering
        console.log('🧪 Testing Date Filtering...');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const startDate = new Date(yesterday);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(yesterday);
        endDate.setHours(23, 59, 59, 999);
        
        console.log(`   Target Date: ${yesterday.toDateString()}`);
        console.log(`   Start: ${startDate.toISOString()}`);
        console.log(`   End: ${endDate.toISOString()}`);
        
        const filteredRecords = await base(tableId).select({
            filterByFormula: `AND(
                IS_AFTER({Booking Date}, '${startDate.toISOString()}'),
                IS_BEFORE({Booking Date}, '${endDate.toISOString()}')
            )`,
            sort: [{ field: 'Booking Date', direction: 'asc' }]
        }).all();
        
        console.log(`   📊 Filtered Results: ${filteredRecords.length} records`);
        
        if (filteredRecords.length > 0) {
            console.log('   📋 First filtered record:');
            const first = filteredRecords[0];
            console.log(`      Name: ${first.get('Name')}`);
            console.log(`      Date: ${first.get('Booking Date')}`);
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

debugData();