#!/usr/bin/env node

/**
 * Test Real API Connections
 * 
 * This script tests the connection to your actual Airtable and Ghost APIs
 * to verify the setup is working correctly.
 */

require('dotenv').config();
const Airtable = require('airtable');
const GhostAdminAPI = require('@tryghost/admin-api');

// Configuration from your environment
const config = {
    airtable: {
        apiKey: process.env.AIRTABLE_API_KEY,
        baseId: process.env.AIRTABLE_BASE_ID,
        tableId: process.env.AIRTABLE_TABLE_ID,
        viewId: process.env.AIRTABLE_VIEW_ID,
        tableName: process.env.AIRTABLE_TABLE_NAME || 'Jail Records',
        adTableName: process.env.AIRTABLE_AD_TABLE_NAME || 'Advertisements'
    },
    ghost: {
        url: process.env.GHOST_SITE_URL,
        key: process.env.GHOST_ADMIN_API_KEY,
        contentKey: process.env.GHOST_CONTENT_API_KEY,
        version: 'v5.0'
    }
};

async function testConnections() {
    console.log('🧪 Testing Real API Connections\\n');
    
    // Test Airtable Connection
    console.log('📊 Testing Airtable Connection...');
    try {
        const airtable = new Airtable({ apiKey: config.airtable.apiKey });
        const base = airtable.base(config.airtable.baseId);
        
        // Get table info
        const table = base(config.airtable.tableId);
        
        console.log(`   ✅ Connected to Airtable`);
        console.log(`   📋 Base ID: ${config.airtable.baseId}`);
        console.log(`   🗂️  Table: ${config.airtable.tableId}`);
        
        // Test fetching records
        console.log('\\n📋 Fetching sample records...');
        const records = await table.select({
            maxRecords: 5,
            view: 'Grid view' // or use your view ID
        }).all();
        
        console.log(`   ✅ Found ${records.length} records`);
        
        if (records.length > 0) {
            const sampleRecord = records[0];
            console.log('\\n📄 Sample Record Structure:');
            console.log(`   ID: ${sampleRecord.id}`);
            
            // Log available fields
            const fields = sampleRecord.fields;
            Object.keys(fields).forEach(field => {
                const value = fields[field];
                if (typeof value === 'object' && value !== null) {
                    console.log(`   ${field}: [${typeof value}] ${Array.isArray(value) ? `Array(${value.length})` : 'Object'}`);
                } else {
                    console.log(`   ${field}: ${value}`);
                }
            });
        }
        
    } catch (error) {
        console.log(`   ❌ Airtable Error: ${error.message}`);
        console.log('   💡 Check your API key and base ID');
        return false;
    }
    
    // Test Ghost Connection
    console.log('\n👻 Testing Ghost.io Connection...');
    try {
        const ghostAPI = new GhostAdminAPI({
            url: config.ghost.url,
            key: config.ghost.key,
            version: config.ghost.version
        });
        
        console.log(`   ✅ Connected to Ghost`);
        console.log(`   🌐 Site URL: ${config.ghost.url}`);
        
        // Test API access by getting site info
        const site = await ghostAPI.site.read();
        console.log(`   📝 Site Title: ${site.title}`);
        console.log(`   🏷️  Site Description: ${site.description}`);
        
        // Test posts access (without creating)
        const posts = await ghostAPI.posts.browse({ limit: 1 });
        console.log(`   📰 Recent Posts: ${posts.length} found`);
        
    } catch (error) {
        console.log(`   ❌ Ghost Error: ${error.message}`);
        console.log('   💡 Check your Admin API key and site URL');
        return false;
    }
    
    console.log('\n🎉 All API connections successful!');
    console.log('\n🚀 Ready to test with real data!');
    return true;
}

async function testRealDataGeneration() {
    console.log('\n🔄 Testing Article Generation with Real Data...');
    
    try {
        // Import the generation function
        const { fetchBookingData, generateArticleHTML } = require('./generate-article');
        
        // Test with yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        console.log(`📅 Fetching data for: ${yesterday.toDateString()}`);
        
        const bookingData = await fetchBookingData(yesterday);
        console.log(`📊 Found ${bookingData.length} booking records`);
        
        if (bookingData.length > 0) {
            console.log('\n📋 Sample Record from Real Data:');
            const sample = bookingData[0];
            console.log(`   Name: ${sample.name}`);
            console.log(`   Age: ${sample.age}`);
            console.log(`   Height: ${sample.height}`);
            console.log(`   Booked: ${sample.bookingDate}`);
            console.log(`   Charges: ${sample.charges.length} charges`);
            console.log(`   Mugshot: ${sample.mugshot ? 'Available' : 'Not available'}`);
        }
        
        // Generate HTML with real data and test ad data
        const testAdData = {
            title: "Sample Advertisement",
            description: "This is where your advertisement content would appear.",
            link: "https://example.com",
            buttonText: "Learn More",
            imageUrl: null
        };
        
        const htmlContent = generateArticleHTML(bookingData, yesterday, testAdData);
        console.log(`\n📝 Generated HTML: ${htmlContent.length} characters`);
        
        // Save test output
        const fs = require('fs');
        const path = require('path');
        const outputPath = path.join(__dirname, '../output/real-data-test.html');
        
        const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Real Data Test - Angelina County Jail Activity</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
        .test-header { background: #28a745; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .jail-activity-article { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="test-header">
        <h1>🎉 Real Data Test Successful!</h1>
        <p>Generated with actual Airtable data on ${new Date().toLocaleString()}</p>
        <p>Records found: ${bookingData.length}</p>
    </div>
    ${htmlContent}
</body>
</html>`;
        
        fs.writeFileSync(outputPath, completeHTML);
        console.log(`\n💾 Saved test file: ${outputPath}`);
        
    } catch (error) {
        console.log(`\n❌ Generation Error: ${error.message}`);
        console.log('💡 Check your Airtable data structure');
        return false;
    }
    
    return true;
}

// Run tests
async function runAllTests() {
    const connectionsOk = await testConnections();
    
    if (connectionsOk) {
        await testRealDataGeneration();
        console.log('\\n✅ All tests completed!');
        console.log('\\n🎯 Next steps:');
        console.log('   1. Check the generated test file in /output');
        console.log('   2. Visit http://localhost:3000/preview?use_real_data=true');
        console.log('   3. When ready, set SKIP_GHOST_PUBLISH=false to enable publishing');
    } else {
        console.log('\\n❌ Fix API connections before proceeding');
    }
}

if (require.main === module) {
    runAllTests();
}

module.exports = { testConnections, testRealDataGeneration };