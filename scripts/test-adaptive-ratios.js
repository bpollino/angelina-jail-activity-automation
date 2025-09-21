require('dotenv').config();

async function testAdaptiveRatios() {
    console.log('🧪 Testing Adaptive Advertisement Container with Multiple Ratios\n');
    
    try {
        const { fetchBookingData, generateArticleHTML } = require('./generate-article');
        const fs = require('fs');
        const path = require('path');
        
        // Test with yesterday's data
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        console.log(`📅 Fetching data for: ${yesterday.toDateString()}`);
        const bookingData = await fetchBookingData(yesterday);
        console.log(`📊 Found ${bookingData.length} booking records`);
        
        // Test different image ratios
        const testCases = [
            {
                name: "Square (1:1) - Instagram Post",
                filename: "adaptive-test-square.html",
                adData: {
                    title: "Local Coffee Shop",
                    description: "Instagram square post format - perfect fit in container",
                    link: "https://example.com",
                    buttonText: "Visit Us",
                    imageUrl: "https://via.placeholder.com/600x600/28a745/ffffff?text=COFFEE+SHOP%0AInstagram+Post%0A1:1+Square%0A%0APerfect+Fit!"
                }
            },
            {
                name: "Portrait (4:5) - Instagram Portrait",
                filename: "adaptive-test-portrait.html", 
                adData: {
                    title: "Real Estate Agent",
                    description: "Instagram portrait format - vertical centering in container",
                    link: "https://example.com",
                    buttonText: "View Listings",
                    imageUrl: "https://via.placeholder.com/800x1000/dc3545/ffffff?text=REAL+ESTATE%0AInstagram+Portrait%0A4:5+Ratio%0A%0AVertical+Center"
                }
            },
            {
                name: "Landscape (16:9) - Banner Format", 
                filename: "adaptive-test-landscape.html",
                adData: {
                    title: "Auto Repair Shop",
                    description: "Widescreen banner format - horizontal centering in container", 
                    link: "https://example.com",
                    buttonText: "Schedule Service",
                    imageUrl: "https://via.placeholder.com/1600x900/fd7e14/ffffff?text=AUTO+REPAIR%0ABanner+Format%0A16:9+Landscape%0A%0AHorizontal+Center"
                }
            },
            {
                name: "Classic (3:2) - Traditional Photo",
                filename: "adaptive-test-classic.html",
                adData: {
                    title: "Photography Studio", 
                    description: "Traditional photo ratio - classic format adaptation",
                    link: "https://example.com",
                    buttonText: "Book Session",
                    imageUrl: "https://via.placeholder.com/900x600/6f42c1/ffffff?text=PHOTO+STUDIO%0AClassic+Format%0A3:2+Ratio%0A%0ATraditional+Photo"
                }
            },
            {
                name: "No Image - Fallback Placeholder",
                filename: "adaptive-test-fallback.html",
                adData: {
                    title: "Business Without Image",
                    description: "Professional fallback when no image is provided",
                    link: "https://example.com", 
                    buttonText: "Learn More",
                    imageUrl: null // Test fallback
                }
            }
        ];
        
        // Generate test for each ratio
        for (const testCase of testCases) {
            console.log(`\n📋 Testing: ${testCase.name}`);
            
            const htmlContent = generateArticleHTML(bookingData, yesterday, testCase.adData);
            const outputPath = path.join(__dirname, '../output', testCase.filename);
            
            // Add test identifier to HTML
            const testHeader = `<!-- ADAPTIVE RATIO TEST: ${testCase.name} -->\n`;
            const finalContent = testHeader + htmlContent;
            
            fs.writeFileSync(outputPath, finalContent);
            console.log(`✅ Generated: ${testCase.filename} (${finalContent.length} characters)`);
        }
        
        console.log('\n🎉 All adaptive ratio tests completed!');
        console.log('\nGenerated test files:');
        testCases.forEach(test => {
            console.log(`   - output/${test.filename} - ${test.name}`);
        });
        
        console.log('\n📖 How to view tests:');
        console.log('1. Run: npm run serve');
        console.log('2. Visit: http://localhost:3000/output/[filename]');
        console.log('3. Observe how different image ratios adapt to the 150x150 container');
        
        console.log('\n🔍 What to look for:');
        console.log('• Square images fill the entire container');
        console.log('• Portrait images center vertically with white space on sides');
        console.log('• Landscape images center horizontally with white space top/bottom');
        console.log('• All images maintain their original aspect ratios');
        console.log('• No images are cropped or distorted');
        console.log('• Professional fallback displays when no image provided');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response && error.response.data) {
            console.error('API Error:', error.response.data);
        }
    }
}

testAdaptiveRatios();