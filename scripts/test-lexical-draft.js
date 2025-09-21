#!/usr/bin/env node

/**
 * Jail Activity Article Generator - Lexical Format
 * 
 * This script generates jail activity articles using Ghost's native Lexical format
 * instead of HTML, which ensures the content is properly saved and displayed.
 */

require('dotenv').config();
const Airtable = require('airtable');
const GhostAdminAPI = require('@tryghost/admin-api');

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
    }
};

// Calculate yesterday's date in Central Time Zone
// Today is Saturday 9/20/2025 Central Time, yesterday was Friday 9/19/2025
const today = new Date(2025, 8, 20); // Today (Saturday) - Month is 0-indexed, so 8 = September
const yesterday = new Date(2025, 8, 19); // Yesterday (Friday) 9/19/2025

config.articleDate = yesterday.toISOString().split('T')[0]; // Format: YYYY-MM-DD
config.articleDayOfWeek = yesterday.toLocaleDateString('en-US', { weekday: 'long' });

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
 * Fetch booking data from Airtable
 */
async function fetchBookingData() {
    if (!airtable) {
        console.log('🎭 Using mock data (Airtable not configured)...');
        return getMockData();
    }

    try {
        console.log('📊 Fetching booking data from Airtable...');
        
        const base = airtable.base(config.airtable.baseId);
        const table = base(config.airtable.tableName);
        
        const records = await table.select({
            sort: [
                { field: 'Booking Date', direction: 'desc' }
            ]
            // Remove maxRecords to get all records
        }).all();

        // Filter records for yesterday's date (09/19/2025)
        const targetDate = '2025-09-19';
        const filteredRecords = records.filter(record => {
            const bookingDate = record.fields['Booking Date'];
            if (!bookingDate) return false;
            
            // Convert booking date to YYYY-MM-DD format for comparison
            let recordDate;
            if (typeof bookingDate === 'string') {
                // If it's already a string, try to parse it
                const parsed = new Date(bookingDate);
                recordDate = parsed.toISOString().split('T')[0];
            } else {
                // If it's a Date object
                recordDate = bookingDate.toISOString().split('T')[0];
            }
            
            console.log(`🔍 Record: ${record.fields['Name']}, Booking Date: ${bookingDate}, Parsed: ${recordDate}`);
            return recordDate === targetDate;
        });

        console.log(`📋 Found ${filteredRecords.length} booking records for ${targetDate}`);
        
        if (filteredRecords.length === 0) {
            console.log('⚠️  No records found for date, using mock data for testing...');
            return getMockData();
        }
        
        return filteredRecords;
        
    } catch (error) {
        console.error('❌ Error fetching Airtable data:', error.message);
        console.log('🎭 Falling back to mock data...');
        return getMockData();
    }
}
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
 * Convert jail activity data to Lexical format with proper styling
 */
function generateLexicalContent(bookingData, articleDate) {
    const date = new Date(articleDate);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    const children = [];
    
    // Add disclaimer as a callout card (styled box)
    children.push({
        type: "callout",
        version: 1,
        calloutEmoji: "⚠️",
        calloutText: "All person(s) listed below are considered innocent until proven guilty in a court of law. Information obtained from public records. <a href='https://www.angelina411.com/legal-disclaimer-daily-arrest-records/' target='_blank' style='color: #007bff; text-decoration: underline;'>Click here to see full disclaimer.</a>",
        backgroundColor: "yellow"
    });
    
    // Add attribution
    children.push({
        children: [
            {
                detail: 0,
                format: 2, // italic
                mode: "normal",
                style: "",
                text: "Booking activity data, details and images provided by courtesy of the Angelina County Sheriff's Department.",
                type: "text",
                version: 1
            }
        ],
        direction: "ltr",
        format: "center",
        indent: 0,
        type: "paragraph",
        version: 1
    });
    
    // Add spacer
    children.push({
        children: [],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1
    });
    
    // Add each arrestee record as HTML cards to preserve styling
    bookingData.forEach((record, index) => {
        const fields = record.fields;
        const fullName = fields['Name'] || 'Name not provided';
        
        // Use raw booking date from Airtable - no formatting
        const bookingDate = fields['Booking Date'] || 'Not provided';
        
        // Handle mugshot with improved validation to prevent broken links
        let mugshotHTML;
        const mugshotUrl = fields['Mugshot URL'];
        
        // Validate URL more strictly and check if it's actually an image
        const isValidImageUrl = mugshotUrl && 
            mugshotUrl.trim() !== '' && 
            (mugshotUrl.startsWith('http://') || mugshotUrl.startsWith('https://')) &&
            (mugshotUrl.includes('.jpg') || mugshotUrl.includes('.jpeg') || mugshotUrl.includes('.png') || mugshotUrl.includes('.gif'));
            
        if (isValidImageUrl) {
            mugshotHTML = `
                <div style="width: 150px; height: 200px; flex-shrink: 0; position: relative;">
                    <img src="${mugshotUrl}" alt="${fullName} mugshot" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 1px solid #ccc;" onload="this.style.display='block'" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div style="width: 100%; height: 100%; background-color: #f0f0f0; border: 2px dashed #ccc; border-radius: 8px; display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #888; position: absolute; top: 0; left: 0;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
                        <div style="font-size: 0.8rem; line-height: 1.2;">Photo Not<br>Available</div>
                    </div>
                </div>`;
        } else {
            mugshotHTML = `
                <div style="width: 150px; height: 200px; background-color: #f0f0f0; border: 2px dashed #ccc; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #888; flex-shrink: 0;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
                    <div style="font-size: 0.8rem; line-height: 1.2;">Photo Not<br>Available</div>
                </div>`;
        }

        // Parse charges and degrees properly
        const offenses = fields['Offenses'] || 'No charges listed';
        const degrees = fields['Degrees'] || '';
        
        let chargesHTML;
        if (offenses.includes(';') || offenses.includes(',')) {
            const separator = offenses.includes(';') ? ';' : ',';
            const chargeList = offenses.split(separator).map(charge => charge.trim());
            
            // Split degrees by same separator and match with charges
            let degreeList = [];
            if (degrees && degrees.trim() !== '') {
                const degreeSeparator = degrees.includes(';') ? ';' : ',';
                degreeList = degrees.split(degreeSeparator).map(degree => degree.trim());
            }
            
            chargesHTML = `
                <div class="charges-section" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;">
                    <p style="margin: 0.5rem 0; font-weight: bold;">Charges:</p>
                    <ul style="margin: 0.5rem 0 0 1rem; padding: 0;">
                        ${chargeList.map((charge, index) => {
                            const degree = degreeList[index] || '';
                            return `<li style="margin: 0.25rem 0;">${charge}${degree ? ` (${degree})` : ''}</li>`;
                        }).join('')}
                    </ul>
                </div>`;
        } else {
            chargesHTML = `
                <div class="charges-section" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;">
                    <p style="margin: 0.5rem 0;"><strong>Charges:</strong> ${offenses}${degrees ? ` (${degrees})` : ''}</p>
                </div>`;
        }

        // Create styled arrestee record as HTML card with consistent width and mobile responsiveness
        const arresteeHTML = `
<style>
@media (max-width: 768px) {
    .arrestee-container {
        flex-direction: column !important;
        align-items: center !important;
    }
    .arrestee-photo {
        order: 1 !important;
        width: 200px !important;
        max-width: 200px !important;
        margin: 0 auto 1rem auto !important;
        display: flex !important;
        justify-content: center !important;
    }
    .arrestee-info {
        order: 2 !important;
        text-align: left !important;
        width: 100% !important;
    }
    .arrestee-grid {
        grid-template-columns: 1fr 1fr !important;
        text-align: left !important;
        gap: 0.3rem !important;
    }
    .charges-section {
        text-align: left !important;
        font-size: 0.85rem !important;
    }
    .charges-section p, .charges-section ul, .charges-section li {
        font-size: 0.85rem !important;
        text-align: left !important;
    }
    .charges-section ul {
        list-style-position: inside !important;
        margin: 0.25rem 0 !important;
    }
    .share-section {
        justify-content: center !important;
    }
}
</style>
<div style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; margin: 2rem auto; background-color: #fafafa; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 800px; width: 100%;">
    <div class="arrestee-container" style="display: flex; gap: 1.5rem; align-items: flex-start; flex-direction: row;">
        <div class="arrestee-photo" style="width: 150px; height: 200px; flex-shrink: 0;">
            ${mugshotHTML.replace('style="width: 150px; height: 200px; flex-shrink: 0; position: relative;"', 'style="width: 100%; height: 200px; position: relative;"')}
        </div>
        <div class="arrestee-info" style="flex: 1; min-width: 0;">
            <h3 style="margin: 0 0 1rem 0; color: #2c3e50; font-size: 1.4rem;">${fullName}</h3>
            <div class="arrestee-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>Age:</strong> ${fields['Age'] || 'Not provided'}</p>
                <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>Sex:</strong> ${fields['Sex'] || 'Not provided'}</p>
                <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>Race:</strong> ${fields['Race'] || 'Not provided'}</p>
                <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>Height:</strong> ${fields['Height'] || 'Not provided'}</p>
                <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>Weight:</strong> ${fields['Weight'] || 'Not provided'}</p>
                <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>Booked:</strong> ${bookingDate}</p>
            </div>
            ${fields['Arresting Agencies'] ? `<p style="margin: 0.5rem 0; font-size: 0.95rem;"><strong>Arresting Agency:</strong> ${fields['Arresting Agencies']}</p>` : ''}
            ${chargesHTML}
            
            <!-- Small Social Sharing Buttons -->
            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #ddd; text-align: right;">
                <div class="share-section" style="display: inline-flex; gap: 0.5rem; align-items: center;">
                    <span style="font-size: 0.8rem; color: #666; margin-right: 0.5rem;">Share:</span>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=https://angelina-411.ghost.io" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: #666; color: white; text-decoration: none; border-radius: 3px; font-size: 12px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#333'" onmouseout="this.style.backgroundColor='#666'" title="Share on Facebook">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </a>
                    <a href="https://twitter.com/intent/tweet?url=https://angelina-411.ghost.io&text=Angelina County Arrests - ${fullName}" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: #666; color: white; text-decoration: none; border-radius: 3px; font-size: 12px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#333'" onmouseout="this.style.backgroundColor='#666'" title="Share on Twitter">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                    </a>
                    <a href="mailto:?subject=Angelina County Arrests&body=Check out this arrest report: https://angelina-411.ghost.io" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: #666; color: white; text-decoration: none; border-radius: 3px; font-size: 12px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#333'" onmouseout="this.style.backgroundColor='#666'" title="Share via Email">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                    </a>
                    <button onclick="navigator.clipboard.writeText('https://angelina-411.ghost.io').then(() => alert('Link copied to clipboard!'))" style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: #666; color: white; border: none; border-radius: 3px; font-size: 12px; cursor: pointer; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#333'" onmouseout="this.style.backgroundColor='#666'" title="Copy Link">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <!-- Small disclaimer text at bottom -->
            <div style="margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid #eee; font-size: 0.75rem; color: #666; text-align: center;">
                All persons listed are considered innocent until proven guilty in a court of law. Information obtained from public records. 
                <a href="https://www.angelina411.com/legal-disclaimer-daily-arrest-records/" target="_blank" style="color: #007bff; text-decoration: underline;">Click here to see full disclaimer.</a>
            </div>
        </div>
    </div>
</div>`;

        // Add as HTML card to preserve styling
        children.push({
            type: "html",
            version: 1,
            html: arresteeHTML
        });
    });
    
    // Add footer with social media sharing
    const postUrl = `${config.ghost.url}/angelina-county-jail-activity-${dayOfWeek.toLowerCase()}-${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}/`;
    const shareText = encodeURIComponent(`Angelina County Arrests - ${dayOfWeek}`);
    
    const footerHTML = `
<hr style="margin: 2rem 0;">

<div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin: 2rem 0;">
    <h4 style="margin: 0 0 1rem 0; color: #2c3e50; text-align: center;">Share This Article</h4>
    <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}" target="_blank" style="background: #1877f2; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-flex; align-items: center; gap: 0.5rem;">
            📘 Share on Facebook
        </a>
        <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(postUrl)}" target="_blank" style="background: #1da1f2; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-flex; align-items: center; gap: 0.5rem;">
            🐦 Share on Twitter
        </a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}" target="_blank" style="background: #0077b5; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-flex; align-items: center; gap: 0.5rem;">
            💼 Share on LinkedIn
        </a>
    </div>
    <div style="text-align: center; margin-top: 1rem;">
        <a href="mailto:?subject=${shareText}&body=Check out this jail activity report: ${encodeURIComponent(postUrl)}" style="background: #6c757d; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-flex; align-items: center; gap: 0.5rem; justify-content: center; max-width: 200px; margin: 0 auto;">
            ✉️ Share via Email
        </a>
    </div>
</div>

<div style="text-align: center; margin-top: 2rem; color: #888;">
    <p><em>Published by Angelina411 News Team</em></p>
    <p style="margin-top: 1rem;">
        <span style="background: #e9ecef; padding: 0.25rem 0.5rem; border-radius: 4px; margin: 0 0.25rem; font-size: 0.8rem;">Jail</span>
        <span style="background: #e9ecef; padding: 0.25rem 0.5rem; border-radius: 4px; margin: 0 0.25rem; font-size: 0.8rem;">Booking</span>
        <span style="background: #e9ecef; padding: 0.25rem 0.5rem; border-radius: 4px; margin: 0 0.25rem; font-size: 0.8rem;">Community Activities</span>
    </p>
</div>`;
    
    children.push({
        type: "html",
        version: 1,
        html: footerHTML
    });
    
    return JSON.stringify({
        root: {
            children: children,
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    });
}

/**
 * Create draft post on Ghost using Lexical format
 */
async function createLexicalDraftPost(bookingData, articleDate) {
    try {
        console.log('📝 Creating Lexical draft post on Ghost.io...');
        
        const date = new Date(articleDate);
        const dayOfWeek = config.articleDayOfWeek; // Use the pre-calculated day of week
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        const title = `Angelina County Arrests - ${dayOfWeek}`;
        const slug = `angelina-county-arrests-${dayOfWeek.toLowerCase()}-${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
        
        const lexicalContent = generateLexicalContent(bookingData, articleDate);
        
        console.log(`🔍 Lexical Content Length: ${lexicalContent.length} characters`);
        
        const postData = {
            title: title,
            slug: slug,
            lexical: lexicalContent,
            status: 'draft',
            tags: [
                { name: 'Jail' },
                { name: 'Booking' },
                { name: 'Community Activities' },
                { name: 'Local News' }
            ],
            excerpt: `Daily jail booking activity for ${formattedDate}. All persons listed are considered innocent until proven guilty in a court of law. Information obtained from public records.`,
            meta_title: `${title} - ${formattedDate}`,
            meta_description: `Complete jail booking activity and arrest records for Angelina County on ${formattedDate}. Includes charges, bond amounts, and booking details.`
        };

        console.log(`📤 Sending Lexical post data...`);
        
        const response = await ghostAPI.posts.add(postData);
        
        console.log('✅ Lexical draft post created successfully!');
        console.log(`📰 Title: ${response.title}`);
        console.log(`🔗 Admin URL: ${config.ghost.url}/ghost/#/editor/post/${response.id}`);
        console.log(`📝 Status: ${response.status}`);
        console.log(`🏷️  Tags: ${response.tags.map(tag => tag.name).join(', ')}`);
        
        // Verify content was saved
        console.log('\n🔍 Verifying content was saved...');
        const fetchedPost = await ghostAPI.posts.read({id: response.id}, {formats: ['html', 'lexical']});
        
        if (fetchedPost.html && fetchedPost.html.length > 0) {
            console.log(`✅ Content verified! HTML length: ${fetchedPost.html.length} characters`);
            console.log(`📝 First 200 chars: ${fetchedPost.html.substring(0, 200)}...`);
        } else {
            console.log('❌ No HTML content found in verification');
        }
        
        return response;
        
    } catch (error) {
        console.error('❌ Error creating Lexical Ghost post:', error);
        throw error;
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('🚀 Starting Lexical Ghost Draft Test...');
        console.log(`📅 Article Date: ${config.articleDate}`);
        console.log(`🌐 Ghost Site: ${config.ghost.url}`);
        console.log('=====================================\n');

        // Fetch booking data from Airtable
        const bookingData = await fetchBookingData();
        
        // Create Lexical draft post
        const post = await createLexicalDraftPost(bookingData, config.articleDate);
        
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
        console.log('   3. Review the content (should now be fully populated!)');
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

module.exports = { main, generateLexicalContent, createLexicalDraftPost };