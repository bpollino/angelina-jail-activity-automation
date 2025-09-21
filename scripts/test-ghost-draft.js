#!/usr/bin/env node

/**
 * Test Ghost Publishing Script
 * 
 * This script creates a test draft post on Ghost.io using current jail activity data
 */

require('dotenv').config();
const Airtable = require('airtable');
const GhostAdminAPI = require('@tryghost/admin-api');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    airtable: {
        apiKey: process.env.AIRTABLE_API_KEY,
        baseId: process.env.AIRTABLE_BASE_ID,
        tableId: process.env.AIRTABLE_TABLE_ID || 'tblq3cgwhhPPjffEi',
        viewId: process.env.AIRTABLE_VIEW_ID || 'viw17thlqxwsSvaVF',
        tableName: process.env.AIRTABLE_TABLE_NAME || 'Jail Records'
    },
    ghost: {
        url: process.env.GHOST_SITE_URL || 'https://angelina-411.ghost.io',
        key: process.env.GHOST_ADMIN_API_KEY,
        version: 'v5.0'
    },
    articleDate: process.env.ARTICLE_DATE || new Date().toISOString().split('T')[0]
};

// Initialize APIs
let airtable, ghostAPI;

try {
    console.log('🔧 Initializing APIs...');
    
    if (config.airtable.apiKey && config.airtable.baseId) {
        airtable = new Airtable({ apiKey: config.airtable.apiKey });
        console.log('✅ Airtable API initialized');
    } else {
        console.log('⚠️  Airtable credentials missing - will use mock data');
    }
    
    if (config.ghost.key && config.ghost.url) {
        ghostAPI = new GhostAdminAPI({
            url: config.ghost.url,
            key: config.ghost.key,
            version: config.ghost.version
        });
        console.log('✅ Ghost API initialized');
    } else {
        console.log('❌ Ghost credentials missing!');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Error initializing APIs:', error.message);
    process.exit(1);
}

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
 * Fetch booking data from Airtable
 */
async function fetchBookingData() {
    if (!airtable) {
        console.log('🎭 Using mock data for testing...');
        return getMockData();
    }

    try {
        console.log('📊 Fetching booking data from Airtable...');
        
        const base = airtable.base(config.airtable.baseId);
        const table = base(config.airtable.tableName);
        
        const records = await table.select({
            view: config.airtable.viewId,
            filterByFormula: `IS_SAME({Booking Date}, DATEVALUE("${config.articleDate}"), "day")`,
            sort: [
                { field: 'Booking Time', direction: 'asc' }
            ]
        }).all();

        console.log(`📋 Found ${records.length} booking records for ${config.articleDate}`);
        
        if (records.length === 0) {
            console.log('⚠️  No records found for date, using mock data for testing...');
            return getMockData();
        }
        
        return records;
        
    } catch (error) {
        console.error('❌ Error fetching Airtable data:', error.message);
        console.log('🎭 Falling back to mock data...');
        return getMockData();
    }
}

/**
 * Generate HTML content for the article (Ghost-optimized)
 */
function generateArticleHTML(bookingData, articleDate) {
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
 * Create draft post on Ghost
 */
async function createDraftPost(htmlContent, articleDate) {
    try {
        console.log('📝 Creating draft post on Ghost.io...');
        
        const date = new Date(articleDate);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        const title = `Angelina County Jail Activity - ${dayOfWeek}`;
        const slug = `angelina-county-jail-activity-${dayOfWeek.toLowerCase()}-${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
        
        // Debug: Log the HTML content being sent
        console.log(`🔍 HTML Content Length: ${htmlContent.length} characters`);
        console.log(`📝 First 300 chars: ${htmlContent.substring(0, 300)}...`);
        
        const postData = {
            title: title,
            slug: slug,
            html: htmlContent,
            status: 'draft',
            tags: [
                { name: 'Jail' },
                { name: 'Booking' },
                { name: 'Community Activities' },
                { name: 'Local News' }
            ],
            excerpt: `Daily jail booking activity for ${formattedDate}. All persons listed are considered innocent until proven guilty in a court of law.`,
            meta_title: `${title} - ${formattedDate}`,
            meta_description: `Complete jail booking activity and arrest records for Angelina County on ${formattedDate}. Includes charges, bond amounts, and booking details.`,
            source: 'html'  // Tell Ghost this is HTML content
        };

        console.log(`📤 Sending post data with ${Object.keys(postData).length} fields`);
        console.log(`📊 Fields being sent: ${Object.keys(postData).join(', ')}`);
        
        const response = await ghostAPI.posts.add(postData);
        
        console.log('✅ Draft post created successfully!');
        console.log(`📰 Title: ${response.title}`);
        console.log(`🔗 Admin URL: ${config.ghost.url}/ghost/#/editor/post/${response.id}`);
        console.log(`📝 Status: ${response.status}`);
        console.log(`🏷️  Tags: ${response.tags.map(tag => tag.name).join(', ')}`);
        
        // Debug: Log what was actually sent and received
        console.log('\n🔍 DEBUG INFO:');
        console.log(` Post Data Keys: ${Object.keys(postData).join(', ')}`);
        console.log(`📋 Response Keys: ${Object.keys(response).join(', ')}`);
        
        if (response.mobiledoc) {
            console.log(`📝 Mobiledoc present: ${response.mobiledoc.length} characters`);
        } else if (response.html) {
            console.log(`📝 HTML present: ${response.html.length} characters`);
        } else {
            console.log('❌ No content fields in response!');
        }
        
        return response;
        
    } catch (error) {
        console.error('❌ Error creating Ghost post:', error);
        if (error.context) {
            console.error('Error context:', error.context);
        }
        if (error.help) {
            console.error('Help:', error.help);
        }
        throw error;
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('🚀 Starting Ghost Draft Test...');
        console.log(`📅 Article Date: ${config.articleDate}`);
        console.log(`🌐 Ghost Site: ${config.ghost.url}`);
        console.log('=====================================\n');

        // Fetch booking data
        const bookingData = await fetchBookingData();
        
        // Generate HTML content
        console.log('🔨 Generating article HTML...');
        const htmlContent = generateArticleHTML(bookingData, config.articleDate);
        
        // Create draft post
        const post = await createDraftPost(htmlContent, config.articleDate);
        
        console.log('\n🎉 Test completed successfully!');
        console.log('=====================================');
        console.log('📋 Summary:');
        console.log(`   Records processed: ${bookingData.length}`);
        console.log(`   Post ID: ${post.id}`);
        console.log(`   Post Status: ${post.status}`);
        console.log(`   Edit URL: ${config.ghost.url}/ghost/#/editor/post/${post.id}`);
        console.log('\n💡 Next steps:');
        console.log('   1. Log into your Ghost admin panel');
        console.log('   2. Go to Posts → Drafts');
        console.log('   3. Review and edit the draft as needed');
        console.log('   4. Publish when ready!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { main, fetchBookingData, generateArticleHTML, createDraftPost };