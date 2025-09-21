#!/usr/bin/env node

/**
 * Debug Ghost HTML Generation
 * 
 * This script generates the HTML and saves it locally so we can inspect it
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * Get mock data for testing
 */
function getMockData() {
    return [
        {
            id: 'rec123test',
            fields: {
                'Last Name': 'Smith',
                'First Name': 'John',
                'Middle Name': 'Michael',
                'Age': 32,
                'City': 'Lufkin',
                'State': 'Texas',
                'Height': '6\' 1"',
                'Weight': '180 lbs',
                'Booking Date': '2025-09-20',
                'Booking Time': '14:30',
                'Release Date': '',
                'Release Time': '',
                'Charges': 'Driving While Intoxicated',
                'Bond Amount': '$2,500',
                'Mugshot': [
                    {
                        url: 'https://via.placeholder.com/300x400/cccccc/666666?text=No+Photo'
                    }
                ]
            }
        },
        {
            id: 'rec456test',
            fields: {
                'Last Name': 'Johnson',
                'First Name': 'Sarah',
                'Middle Name': 'Elizabeth',
                'Age': 28,
                'City': 'Nacogdoches',
                'State': 'Texas',
                'Height': '5\' 6"',
                'Weight': '135 lbs',
                'Booking Date': '2025-09-20',
                'Booking Time': '09:15',
                'Release Date': '2025-09-20',
                'Release Time': '18:45',
                'Charges': 'Public Intoxication',
                'Bond Amount': '$500',
                'Mugshot': []
            }
        },
        {
            id: 'rec789test',
            fields: {
                'Last Name': 'Williams',
                'First Name': 'Robert',
                'Middle Name': '',
                'Age': 45,
                'City': 'Huntington',
                'State': 'Texas',
                'Height': '5\' 10"',
                'Weight': '195 lbs',
                'Booking Date': '2025-09-20',
                'Booking Time': '23:20',
                'Release Date': '',
                'Release Time': '',
                'Charges': 'Assault - Family Violence; Possession of Controlled Substance',
                'Bond Amount': '$10,000',
                'Mugshot': []
            }
        }
    ];
}

/**
 * Generate HTML content for Ghost (without embedded styles)
 */
function generateGhostHTML(bookingData, articleDate) {
    const date = new Date(articleDate);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });

    let arresteeRecords = '';
    
    bookingData.forEach((record, index) => {
        const fields = record.fields;
        const fullName = `${fields['Last Name'] || ''}, ${fields['First Name'] || ''} ${fields['Middle Name'] || ''}`.trim();
        const isReleased = fields['Release Date'] && fields['Release Time'];
        const releaseInfo = isReleased 
            ? `${fields['Release Date']} - ${fields['Release Time']}` 
            : 'Still in custody';

        // Handle mugshot
        let mugshotHTML;
        if (fields['Mugshot'] && fields['Mugshot'].length > 0) {
            const mugshotUrl = fields['Mugshot'][0].url;
            mugshotHTML = `
                <div class="kg-width-wide">
                    <figure class="kg-card kg-image-card">
                        <img src="${mugshotUrl}" alt="${fullName} mugshot" class="kg-image" style="max-width: 200px; border-radius: 8px;">
                        <figcaption>${fullName}</figcaption>
                    </figure>
                </div>`;
        } else {
            mugshotHTML = `
                <div style="width: 150px; height: 200px; background-color: #f0f0f0; border: 2px dashed #ccc; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #888; margin: 1rem 0;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
                    <div style="font-size: 0.8rem; line-height: 1.2;">Photo Not<br>Available</div>
                </div>`;
        }

        // Parse charges
        const charges = fields['Charges'] || 'No charges listed';
        const bondAmount = fields['Bond Amount'] || 'Not set';
        
        let chargesHTML;
        if (charges.includes(';')) {
            const chargeList = charges.split(';').map(charge => charge.trim());
            chargesHTML = `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;">
                    <p><strong>Charges:</strong></p>
                    <ul style="margin: 0.5rem 0 0 1rem; padding: 0;">
                        ${chargeList.map(charge => `<li style="margin: 0.25rem 0;">${charge} (Bond: ${bondAmount})</li>`).join('')}
                    </ul>
                </div>`;
        } else {
            chargesHTML = `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;">
                    <p><strong>Charges:</strong> ${charges} (Bond: ${bondAmount})</p>
                </div>`;
        }

        arresteeRecords += `
<div class="kg-card kg-callout-card kg-callout-card-white" style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; margin: 2rem 0; background-color: #fafafa;">
    <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
        ${mugshotHTML}
        <div style="flex: 1;">
            <h3 style="margin: 0 0 1rem 0; color: #2c3e50;">${fullName}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>Age:</strong> ${fields['Age'] || 'Not provided'}</p>
                <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>City:</strong> ${fields['City'] || 'Not provided'}</p>
                <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>State:</strong> ${fields['State'] || 'Not provided'}</p>
                <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>Height:</strong> ${fields['Height'] || 'Not provided'}</p>
                <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>Weight:</strong> ${fields['Weight'] || 'Not provided'}</p>
                <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>Booked:</strong> ${fields['Booking Date'] || 'Not provided'} - ${fields['Booking Time'] || 'Not provided'}</p>
            </div>
            <p style="margin: 0.5rem 0; font-size: 0.95rem;"><strong>Released:</strong> ${releaseInfo}</p>
            ${chargesHTML}
        </div>
    </div>
</div>`;
    });

    // If no arrests, show message
    if (bookingData.length === 0) {
        arresteeRecords = `
<div class="kg-card kg-callout-card kg-callout-card-blue" style="text-align: center; padding: 3rem; background-color: #f8f9fa; border-radius: 8px; color: #666;">
    <p>No booking activity recorded for ${dayOfWeek}, ${formattedDate}.</p>
</div>`;
    }

    return `<div class="kg-card kg-callout-card kg-callout-card-yellow" style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 1rem; margin: 1.5rem 0; text-align: center;">
    <p style="font-weight: bold; color: #856404; margin: 0;"><strong>All person(s) listed below are considered innocent until proven guilty in a court of law.</strong></p>
</div>

<p style="font-style: italic; color: #666; text-align: center; margin: 1rem 0;">Booking activity data, details and images provided by courtesy of the Angelina County Sheriff's Department.</p>

${arresteeRecords}

<hr>

<div style="text-align: center; margin-top: 2rem; color: #888;">
    <p><em>Published by Angelina411 News Team</em></p>
    <p style="margin-top: 1rem;">
        <span style="background: #e9ecef; padding: 0.25rem 0.5rem; border-radius: 4px; margin: 0 0.25rem; font-size: 0.8rem;">Jail</span>
        <span style="background: #e9ecef; padding: 0.25rem 0.5rem; border-radius: 4px; margin: 0 0.25rem; font-size: 0.8rem;">Booking</span>
        <span style="background: #e9ecef; padding: 0.25rem 0.5rem; border-radius: 4px; margin: 0 0.25rem; font-size: 0.8rem;">Community Activities</span>
    </p>
</div>`;
}

/**
 * Main execution function
 */
async function main() {
    const articleDate = '2025-09-20';
    console.log('🔍 Debugging HTML Generation...');
    
    // Get mock data
    const bookingData = getMockData();
    console.log(`📊 Using ${bookingData.length} mock records`);
    
    // Generate HTML
    const htmlContent = generateGhostHTML(bookingData, articleDate);
    
    // Save to file for inspection
    const outputPath = path.join(__dirname, '../output/ghost-debug-output.html');
    fs.writeFileSync(outputPath, `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ghost HTML Debug Output</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
        .preview-note { background: #e3f2fd; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
    </style>
</head>
<body>
    <div class="preview-note">
        <h2>🔍 Ghost HTML Debug Preview</h2>
        <p>This is exactly what will be sent to Ghost.io as the post body HTML.</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <h1>Angelina County Jail Activity - Friday</h1>
    
    ${htmlContent}
</body>
</html>`);
    
    console.log(`✅ HTML saved to: ${outputPath}`);
    console.log('📄 You can open this file to see exactly what Ghost will receive');
    
    // Also log just the HTML content
    console.log('\n📝 Raw HTML Content:');
    console.log('=' .repeat(50));
    console.log(htmlContent);
    console.log('=' .repeat(50));
    
    return htmlContent;
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, generateGhostHTML, getMockData };