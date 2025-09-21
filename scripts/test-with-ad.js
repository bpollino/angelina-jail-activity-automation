require('dotenv').config();

async function testWithAd() {
    console.log('🧪 Testing Real Data with Advertisement\n');
    
    try {
        // Import the generation function
        const { fetchBookingData, generateArticleHTML } = require('./generate-article');
        
        // Test with yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        console.log(`📅 Fetching data for: ${yesterday.toDateString()}`);
        
        const bookingData = await fetchBookingData(yesterday);
        console.log(`📊 Found ${bookingData.length} booking records`);
        
        // Create sample ad data - testing with landscape ratio (16:9)
        const testAdData = {
            title: "Smith Law Firm - Criminal Defense",
            description: "Experienced criminal defense attorney serving East Texas. Demonstrating adaptive container with landscape image.",
            link: "https://www.smithlawfirm.com",
            buttonText: "Free Consultation",
            // Using 16:9 landscape image to demonstrate adaptive container
            imageUrl: "https://via.placeholder.com/1600x900/007acc/ffffff?text=SMITH+LAW+FIRM%0ACriminal+Defense%0A(903)+555-0123%0A%0A16:9+Landscape+Format"
        };
        
        // Generate HTML with real data and test ad
        const htmlContent = generateArticleHTML(bookingData, yesterday, testAdData);
        console.log(`📝 Generated HTML with Ad: ${htmlContent.length} characters`);
        
        // Save test output
        const fs = require('fs');
        const path = require('path');
        const outputPath = path.join(__dirname, '../output/real-data-with-ad-test.html');
        
        const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Real Data with Ad Test - Angelina County Jail Activity</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
        .test-header { background: #007acc; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .jail-activity-article { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="test-header">
        <h1>🎉 Real Data with Advertisement Test!</h1>
        <p>Generated with actual Airtable data and sample ad on ${new Date().toLocaleString()}</p>
        <p>Records found: ${bookingData.length}</p>
    </div>
    ${htmlContent}
</body>
</html>`;
        
        fs.writeFileSync(outputPath, completeHTML);
        console.log(`💾 Saved test file with ad: ${outputPath}`);
        console.log(`📱 View at: http://localhost:3000/real-data-with-ad`);
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
    
    return true;
}

testWithAd();