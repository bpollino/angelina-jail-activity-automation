#!/usr/bin/env node

/**
 * Local Test Script for Article Generation
 * 
 * This script allows you to test the article generation locally
 * without connecting to Airtable or Ghost APIs
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Import mock data and generation functions
const { mockBookingData, mockAdvertisementData, mockScenarios } = require('../data/mock-data');

// Import the generation function (we'll modify this to handle mocks)
async function testLocalGeneration() {
    console.log('🧪 Starting Local Article Generation Test\n');
    
    try {
        // Test different scenarios
        const scenarios = [
            { name: 'Default Records', data: mockBookingData },
            { name: 'No Arrests', data: mockScenarios.noArrests },
            { name: 'Single Arrest', data: mockScenarios.singleArrest },
            { name: 'No Mugshots', data: mockScenarios.noMugshots },
            { name: 'All Released', data: mockScenarios.allReleased }
        ];
        
        for (const scenario of scenarios) {
            console.log(`📋 Testing: ${scenario.name}`);
            console.log(`   Records: ${scenario.data.length}`);
            
            const targetDate = new Date('2023-12-19');
            
            // Generate HTML (we'll create a local version)
            const htmlContent = generateLocalArticleHTML(scenario.data, targetDate, mockAdvertisementData);
            
            // Save to file for inspection
            const filename = `test-output-${scenario.name.toLowerCase().replace(/\\s+/g, '-')}.html`;
            const outputPath = path.join(__dirname, '../output', filename);
            
            // Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            // Write complete HTML file
            const completeHTML = createCompleteHTMLDocument(htmlContent, scenario.name);
            fs.writeFileSync(outputPath, completeHTML);
            
            console.log(`   ✅ Generated: ${filename}`);
            console.log(`   📁 Location: ${outputPath}\\n`);
        }
        
        console.log('🎉 All test scenarios completed successfully!');
        console.log('\\n📂 Check the output/ directory for generated HTML files');
        console.log('🌐 Or run "npm run serve" to view them in a browser');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

/**
 * Local version of article HTML generation
 */
function generateLocalArticleHTML(bookingData, targetDate, adData = null) {
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    let html = `
        <!-- Include Font Awesome for icons -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        
        <!-- Include Lightbox CSS and JS -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/css/lightbox.min.css">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/js/lightbox.min.js"></script>
        
        <div class="jail-activity-article">
            <p><em>Booking activity data, details and images provided by courtesy of the Angelina County Sheriff's Department.</em></p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #007acc; padding: 15px 20px; margin: 20px 0; border-radius: 4px;">
                <p><strong><em>All person(s) listed below are considered innocent until proven guilty in a court of law.</em></strong></p>
            </div>
    `;
    
    // Add advertisement if available
    if (adData && adData.imageUrl) {
        html += `
            <div style="margin: 30px 0; text-align: center; background-color: #fff; border: 1px solid #e1e1e1; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; font-weight: 500;">Advertisement</div>
                <a href="${adData.linkUrl}" target="_blank" rel="noopener">
                    <img src="${adData.imageUrl}" alt="${adData.altText}" style="max-width: 100%; height: auto; border-radius: 4px;">
                </a>
            </div>
        `;
    }
    
    if (bookingData.length === 0) {
        html += `
            <div style="text-align: center; padding: 40px 20px; background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #28a745; margin-bottom: 10px;">No Arrests Recorded</h3>
                <p style="color: #666; margin: 0;">No booking activity was recorded for ${dayOfWeek}, ${targetDate.toLocaleDateString()}.</p>
            </div>
        `;
    } else {
        bookingData.forEach((arrestee, index) => {
            html += generateLocalArresteeHTML(arrestee, index);
        });
    }
    
    html += `
            <hr style="margin: 30px 0;">
            <p><em>Published by Angelina411 News Team</em></p>
        </div>
        
        <!-- Social Sharing JavaScript -->
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            initializeSocialSharing();
        });

        function initializeSocialSharing() {
            const shareButtons = document.querySelectorAll('.share-btn');
            
            shareButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const platform = this.dataset.platform;
                    const record = this.closest('.arrestee-record');
                    const recordData = extractRecordData(record);
                    
                    handleShare(platform, recordData, record);
                });
            });
        }

        function extractRecordData(recordElement) {
            const nameEl = recordElement.querySelector('.arrestee-name');
            const ageEl = recordElement.querySelector('.arrestee-age');
            const cityEl = recordElement.querySelector('.arrestee-city');
            const stateEl = recordElement.querySelector('.arrestee-state');
            const bookingDateEl = recordElement.querySelector('.booking-date');
            const chargesElements = recordElement.querySelectorAll('.charges-list li');
            
            const name = nameEl ? nameEl.textContent.trim() : 'Unknown';
            const age = ageEl ? ageEl.textContent.trim() : 'Unknown';
            const city = cityEl ? cityEl.textContent.trim() : '';
            const state = stateEl ? stateEl.textContent.trim() : '';
            const bookingDate = bookingDateEl ? bookingDateEl.textContent.trim() : '';
            
            const charges = Array.from(chargesElements).map(el => el.textContent.trim());
            
            return {
                name, age, city, state, bookingDate, charges,
                recordId: recordElement.dataset.recordId
            };
        }

        function handleShare(platform, recordData, recordElement) {
            const baseUrl = window.location.href.split('#')[0];
            const recordUrl = baseUrl + '#' + recordData.recordId;
            const shareText = createShareText(recordData);
            
            console.log('Local test - would share:', { platform, recordData, recordUrl, shareText });
            alert('LOCAL TEST: Would share on ' + platform + '\\n\\n' + shareText + '\\n\\n' + recordUrl);
        }

        function createShareText(recordData) {
            const location = recordData.city && recordData.state ? 
                recordData.city + ', ' + recordData.state : 
                (recordData.city || recordData.state || 'Angelina County');
            
            const primaryCharge = recordData.charges.length > 0 ? 
                recordData.charges[0].split('(')[0].trim() : 
                'Multiple charges';
            
            return 'Angelina County Jail Activity: ' + recordData.name + ', age ' + recordData.age + ' from ' + location + ' - ' + primaryCharge + '. Booked ' + recordData.bookingDate;
        }
        </script>
    `;
    
    return html;
}

/**
 * Generate HTML for individual arrestee (local version)
 */
function generateLocalArresteeHTML(arrestee, index = 0) {
    // Generate unique record ID for sharing
    const recordId = `record-${Date.now()}-${index}`;
    
    const chargesList = arrestee.charges.map(charge => 
        `<li>${charge.description} (Bond: $${charge.bond.toFixed(1)})</li>`
    ).join('');
    
    // Format booking date
    const bookingDate = arrestee.bookingDate.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
    }) + ' ' + arrestee.bookingDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    });
    
    // Improved mugshot handling with better placeholder design
    const mugshotHTML = arrestee.mugshot 
        ? `<a href="${arrestee.mugshot}" data-lightbox="mugshots" data-title="${arrestee.name}">
            <img src="${arrestee.mugshot}" alt="Mugshot of ${arrestee.name}" style="width: 100%; max-width: 150px; border-radius: 6px; border: 2px solid #ddd;">
           </a>`
        : `<div style="width: 150px; height: 180px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 6px; border: 2px dashed #dee2e6; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #6c757d; text-align: center; font-size: 11px; padding: 10px; box-sizing: border-box;">
            <div style="font-size: 24px; margin-bottom: 8px; opacity: 0.5;">📷</div>
            <div style="line-height: 1.3;">Photo Not<br>Available</div>
        </div>`;
    
    // Only show Released field if there's actually release data
    const releaseInfo = arrestee.releaseDate 
        ? `<p><strong>Released:</strong> <span class="release-date">${arrestee.releaseDate.toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: 'numeric' 
        })} ${arrestee.releaseDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        })}</span></p>`
        : '';
    
    return `
        <div class="arrestee-record" id="${recordId}" data-record-id="${recordId}" style="display: flex; gap: 20px; margin: 30px 0; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; background-color: #fafafa; position: relative;">
            <div class="mugshot-container" style="flex-shrink: 0;">
                ${mugshotHTML}
            </div>
            <div class="arrestee-details" style="flex: 1;">
                <p><strong>Name:</strong> <span class="arrestee-name">${arrestee.name}</span></p>
                <p><strong>Age:</strong> <span class="arrestee-age">${arrestee.age}</span></p>
                <p><strong>City:</strong> <span class="arrestee-city">${arrestee.city}</span></p>
                <p><strong>State:</strong> <span class="arrestee-state">${arrestee.state}</span></p>
                <p><strong>Height:</strong> <span class="arrestee-height">${arrestee.height}</span></p>
                <p><strong>Weight:</strong> <span class="arrestee-weight">${arrestee.weight}</span></p>
                <p><strong>Booked:</strong> <span class="booking-date">${bookingDate}</span></p>
                ${releaseInfo}
                ${chargesList ? `
                <div style="margin-top: 15px;">
                    <p><strong>Charges:</strong></p>
                    <ul class="charges-list" style="margin: 8px 0; padding-left: 20px;">
                        ${chargesList}
                    </ul>
                </div>
                ` : ''}
                
                <!-- Social Sharing Buttons -->
                <div class="social-sharing" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e1e1e1;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; font-weight: bold;">Share this record:</p>
                    <div style="display: flex; gap: 8px;">
                        <button class="share-btn facebook-share" data-platform="facebook" style="background: #1877f2; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 5px;">
                            <i class="fab fa-facebook-f" style="font-size: 11px;"></i>
                            Share
                        </button>
                        <button class="share-btn twitter-share" data-platform="twitter" style="background: #1da1f2; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 5px;">
                            <i class="fab fa-twitter" style="font-size: 11px;"></i>
                            Tweet
                        </button>
                        <button class="share-btn copy-link" data-platform="copy" style="background: #6c757d; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-link" style="font-size: 11px;"></i>
                            Copy Link
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Create complete HTML document for testing
 */
function createCompleteHTMLDocument(content, title) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test: ${title} - Angelina County Jail Activity</title>
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        
        .test-header {
            background: #007acc;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .jail-activity-article {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .social-sharing button {
            transition: all 0.2s ease;
        }
        
        .social-sharing button:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .facebook-share:hover { background-color: #166fe5 !important; }
        .twitter-share:hover { background-color: #1991da !important; }
        .copy-link:hover { background-color: #5a6268 !important; }
    </style>
</head>
<body>
    <div class="test-header">
        <h1>🧪 Test Output: ${title}</h1>
        <p>Generated at: ${new Date().toLocaleString()}</p>
    </div>
    
    ${content}
    
    <div style="margin-top: 40px; padding: 20px; background: #e9ecef; border-radius: 8px; text-align: center;">
        <p><strong>📋 This is a test output file</strong></p>
        <p>Social sharing buttons will show alerts instead of actual sharing in test mode</p>
    </div>
</body>
</html>`;
}

// Run the test if this script is executed directly
if (require.main === module) {
    testLocalGeneration();
}

module.exports = {
    testLocalGeneration,
    generateLocalArticleHTML,
    generateLocalArresteeHTML,
    createCompleteHTMLDocument
};