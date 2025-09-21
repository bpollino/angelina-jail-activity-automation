#!/usr/bin/env node

/**
 * Daily Jail Activity Post Deployment Script
 * 
 * This script automatically creates and publishes daily jail activity posts
 * from Airtable data to Ghost.io CMS. Designed to run via GitHub Actions.
 */

const dotenv = require('dotenv');
const Airtable = require('airtable');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Configuration
const config = {
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID || 'appBn4Xs7GdnheynS',
    tableId: process.env.AIRTABLE_TABLE_ID || 'tblq3cgwhhPPjffEi'
  },
  ghost: {
    adminApiKey: process.env.GHOST_ADMIN_API_KEY,
    apiUrl: process.env.GHOST_API_URL || 'https://angelina-411.ghost.io'
  }
};

// Validate configuration
function validateConfig() {
  const required = [
    'AIRTABLE_API_KEY',
    'GHOST_ADMIN_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
  
  console.log('✅ Configuration validated');
}

// Initialize APIs
function initializeAPIs() {
  try {
    // Initialize Airtable
    Airtable.configure({ apiKey: config.airtable.apiKey });
    const base = Airtable.base(config.airtable.baseId);
    const table = base(config.airtable.tableId);
    
    // Initialize Ghost JWT
    const [id, secret] = config.ghost.adminApiKey.split(':');
    const token = jwt.sign({}, Buffer.from(secret, 'hex'), {
      keyid: id,
      algorithm: 'HS256',
      expiresIn: '5m',
      audience: '/admin/'
    });
    
    console.log('✅ APIs initialized successfully');
    return { table, ghostToken: token };
  } catch (error) {
    console.error('❌ Failed to initialize APIs:', error.message);
    process.exit(1);
  }
}

// Get target date (yesterday's bookings for today's post)
function getTargetDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  // Convert to Central Time (UTC-5/UTC-6)
  const centralTime = new Date(yesterday.getTime() - (6 * 60 * 60 * 1000));
  const targetDate = centralTime.toISOString().split('T')[0];
  
  console.log(`📅 Target date: ${targetDate}`);
  return targetDate;
}

// Fetch booking records from Airtable
async function fetchBookingRecords(table, targetDate) {
  try {
    console.log('📊 Fetching booking data from Airtable...');
    
    const records = await table.select({
      sort: [{ field: 'Booking Date', direction: 'desc' }]
    }).all();

    // Filter records for target date
    const filteredRecords = records.filter(record => {
      const bookingDate = record.fields['Booking Date'];
      if (!bookingDate) return false;
      
      // Convert booking date to YYYY-MM-DD format for comparison
      let recordDate;
      if (typeof bookingDate === 'string') {
        const parsed = new Date(bookingDate);
        recordDate = parsed.toISOString().split('T')[0];
      } else {
        recordDate = bookingDate.toISOString().split('T')[0];
      }
      
      console.log(`🔍 Record: ${record.fields['Name']}, Booking Date: ${bookingDate}, Parsed: ${recordDate}`);
      return recordDate === targetDate;
    });
    
    console.log(`📋 Found ${filteredRecords.length} booking records for ${targetDate}`);
    
    if (filteredRecords.length === 0) {
      console.log('ℹ️ No records found for target date. This may be normal for weekends or holidays.');
    }
    
    return filteredRecords;
  } catch (error) {
    console.error('❌ Failed to fetch booking records:', error.message);
    if (error.message.includes('not authorized')) {
      console.error('🔑 Authorization Error: Check your Airtable Personal Access Token has proper scopes:');
      console.error('   - data.records:read');
      console.error('   - schema.bases:read');
      console.error('   - Access to base: ' + config.airtable.baseId);
    }
    throw error;
  }
}

// Generate post title based on day of week
function generatePostTitle(targetDate) {
  const date = new Date(targetDate + 'T12:00:00Z');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[date.getDay()];
  
  return `Angelina County Arrests - ${dayName}`;
}

// Generate Lexical content (using the same logic from test-lexical-draft.js)
function generateLexicalContent(records, targetDate) {
  const title = generatePostTitle(targetDate);
  const date = new Date(targetDate + 'T12:00:00Z');
  
  const children = [];
  
  // Add disclaimer as a callout card
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
  
  if (records.length === 0) {
    children.push({
      children: [
        {
          detail: 0,
          format: 1, // bold
          mode: "normal",
          style: "",
          text: "No arrest records found for this date.",
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
  } else {
    // Add each record as an HTML card
    records.forEach((record) => {
      const fields = record.fields;
      const fullName = fields['Name'] || 'Name not provided';
      const bookingDate = fields['Booking Date'] || 'Not provided';
      
      // Handle mugshot
      let mugshotHTML;
      const mugshotUrl = fields['Mugshot URL'];
      const isValidImageUrl = mugshotUrl && 
        mugshotUrl.trim() !== '' && 
        (mugshotUrl.startsWith('http://') || mugshotUrl.startsWith('https://')) &&
        (mugshotUrl.includes('.jpg') || mugshotUrl.includes('.jpeg') || mugshotUrl.includes('.png') || mugshotUrl.includes('.gif'));
        
      if (isValidImageUrl) {
        mugshotHTML = `<img src="${mugshotUrl}" alt="${fullName} mugshot" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 1px solid #ccc;">`;
      } else {
        mugshotHTML = `<div style="width: 100%; height: 100%; background-color: #f0f0f0; border: 2px dashed #ccc; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #888;"><div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div><div style="font-size: 0.8rem;">Photo Not Available</div></div>`;
      }

      // Parse charges
      const offenses = fields['Offenses'] || 'No charges listed';
      const degrees = fields['Degrees'] || '';
      
      let chargesHTML;
      if (offenses.includes(';') || offenses.includes(',')) {
        const separator = offenses.includes(';') ? ';' : ',';
        const chargeList = offenses.split(separator).map(charge => charge.trim());
        
        let degreeList = [];
        if (degrees && degrees.trim() !== '') {
          const degreeSeparator = degrees.includes(';') ? ';' : ',';
          degreeList = degrees.split(degreeSeparator).map(degree => degree.trim());
        }
        
        chargesHTML = `<div class="charges-section" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;"><p style="margin: 0.5rem 0; font-weight: bold;">Charges:</p><ul style="margin: 0.5rem 0 0 1rem; padding: 0;">${chargeList.map((charge, index) => {
          const degree = degreeList[index] || '';
          return `<li style="margin: 0.25rem 0;">${charge}${degree ? ` (${degree})` : ''}</li>`;
        }).join('')}</ul></div>`;
      } else {
        chargesHTML = `<div class="charges-section" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;"><p style="margin: 0.5rem 0;"><strong>Charges:</strong> ${offenses}${degrees ? ` (${degrees})` : ''}</p></div>`;
      }

      // Encode data for social sharing
      const recordData = encodeURIComponent(JSON.stringify({
        name: fullName,
        age: fields['Age'] || 'Not provided',
        charges: offenses
      }));
      
      // Social sharing buttons (simplified without complex JavaScript)
      const shareButtons = `<div class="share-buttons" style="display: flex; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;">
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://angelina411.com')}" target="_blank" style="display: inline-flex; align-items: center; padding: 0.5rem; background-color: #f8f9fa; color: #666; text-decoration: none; border-radius: 4px; font-size: 0.9rem; border: 1px solid #ddd; transition: all 0.2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 0.25rem;">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Share
        </a>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`${fullName} arrested in Angelina County`)}&url=${encodeURIComponent('https://angelina411.com')}" target="_blank" style="display: inline-flex; align-items: center; padding: 0.5rem; background-color: #f8f9fa; color: #666; text-decoration: none; border-radius: 4px; font-size: 0.9rem; border: 1px solid #ddd; transition: all 0.2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 0.25rem;">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
          Tweet
        </a>
        <a href="mailto:?subject=${encodeURIComponent(`${fullName} - Angelina County Arrest`)}&body=${encodeURIComponent(`View arrest details: https://angelina411.com`)}" style="display: inline-flex; align-items: center; padding: 0.5rem; background-color: #f8f9fa; color: #666; text-decoration: none; border-radius: 4px; font-size: 0.9rem; border: 1px solid #ddd; transition: all 0.2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 0.25rem;">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          Email
        </a>
        <a href="#" onclick="navigator.clipboard.writeText('https://angelina411.com').then(() => alert('Link copied to clipboard!')); return false;" style="display: inline-flex; align-items: center; padding: 0.5rem; background-color: #f8f9fa; color: #666; text-decoration: none; border-radius: 4px; font-size: 0.9rem; border: 1px solid #ddd; transition: all 0.2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 0.25rem;">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          Copy Link
        </a>
      </div>`;

      // Individual disclaimer
      const individualDisclaimer = `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd; font-size: 0.8rem; color: #666; text-align: center;"><em>All persons listed are innocent until proven guilty in a court of law. <a href="https://www.angelina411.com/legal-disclaimer-daily-arrest-records/" target="_blank" style="color: #007bff;">View full disclaimer</a></em></div>`;

      // Create HTML card with fixed width and mobile responsiveness
      const arresteeHTML = `<style>
        @media (max-width: 768px) { 
          .arrestee-container { flex-direction: column !important; align-items: center !important; } 
          .arrestee-photo { order: 1 !important; width: 200px !important; margin: 0 auto 1rem auto !important; } 
          .arrestee-info { order: 2 !important; text-align: left !important; width: 100% !important; } 
          .arrestee-grid { grid-template-columns: 1fr 1fr !important; gap: 0.3rem !important; } 
          .charges-section { text-align: left !important; font-size: 0.85rem !important; } 
          .share-buttons { flex-wrap: wrap !important; gap: 0.25rem !important; } 
          .share-buttons a { font-size: 0.8rem !important; padding: 0.4rem !important; } 
        }
      </style>
      <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; margin: 2rem auto; background-color: #fafafa; max-width: 800px; width: 100%; box-sizing: border-box;">
        <div class="arrestee-container" style="display: flex; gap: 1.5rem; align-items: flex-start;">
          <div class="arrestee-photo" style="width: 150px; height: 200px; flex-shrink: 0;">${mugshotHTML}</div>
          <div class="arrestee-info" style="flex: 1; min-width: 0;">
            <h3 style="margin: 0 0 1rem 0; color: #2c3e50; font-size: 1.4rem; word-wrap: break-word;">${fullName}</h3>
            <div class="arrestee-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
              <p style="margin: 0.25rem 0;"><strong>Age:</strong> ${fields['Age'] || 'Not provided'}</p>
              <p style="margin: 0.25rem 0;"><strong>Sex:</strong> ${fields['Sex'] || 'Not provided'}</p>
              <p style="margin: 0.25rem 0;"><strong>Race:</strong> ${fields['Race'] || 'Not provided'}</p>
              <p style="margin: 0.25rem 0;"><strong>Height:</strong> ${fields['Height'] || 'Not provided'}</p>
              <p style="margin: 0.25rem 0;"><strong>Weight:</strong> ${fields['Weight'] || 'Not provided'}</p>
              <p style="margin: 0.25rem 0;"><strong>Booked:</strong> ${bookingDate}</p>
            </div>
            ${chargesHTML}
            ${shareButtons}
            ${individualDisclaimer}
          </div>
        </div>
      </div>`;
      
      children.push({
        type: "html",
        version: 1,
        html: arresteeHTML
      });
    });
  }
  
  return {
    version: "0.15.0",
    root: {
      type: "root",
      format: "",
      indent: 0,
      children: children
    }
  };
}

// Create and publish Ghost post
async function createGhostPost(ghostToken, title, content, targetDate) {
  try {
    console.log('📝 Creating Ghost post...');
    
    const postData = {
      posts: [{
        title: title,
        status: 'published', // Publish automatically
        authors: ['Publius'],
        tags: ['Angelina County', 'News', 'Jail', 'Data', 'Crime'],
        lexical: JSON.stringify(content),
        feature_image: 'https://www.dropbox.com/scl/fi/tq0u9p3i0bru7mluia90o/Angelina-Count-Arrest-Records.png?rlkey=6yo3oa5i1skxud4fi6x5prus5&st=kc8lqos2&dl=1',
        created_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        meta_title: `${title} | Angelina411.com`,
        meta_description: `Daily arrest and booking activity from Angelina County Sheriff's Department for ${targetDate}`,
        og_title: title,
        og_description: `View arrest records and booking activity from Angelina County`,
        twitter_title: title,
        twitter_description: `Daily jail activity report for Angelina County`
      }]
    };
    
    const response = await axios.post(
      `${config.ghost.apiUrl}/ghost/api/admin/posts/`,
      postData,
      {
        headers: {
          'Authorization': `Ghost ${ghostToken}`,
          'Content-Type': 'application/json',
          'Accept-Version': 'v5.0'
        }
      }
    );
    
    const post = response.data.posts[0];
    console.log('✅ Post published successfully!');
    console.log(`📰 Title: ${post.title}`);
    console.log(`🔗 URL: ${post.url}`);
    console.log(`📝 Status: ${post.status}`);
    
    return post;
  } catch (error) {
    console.error('❌ Failed to create Ghost post:', error.response?.data || error.message);
    throw error;
  }
}

// Main deployment function
async function deployDailyPost() {
  console.log('🚀 Starting daily jail activity post deployment...');
  console.log('=====================================');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize APIs
    const { table, ghostToken } = initializeAPIs();
    
    // Get target date
    const targetDate = getTargetDate();
    
    // Fetch booking records
    const records = await fetchBookingRecords(table, targetDate);
    
    // Generate post content
    const title = generatePostTitle(targetDate);
    const content = generateLexicalContent(records, targetDate);
    
    // Create and publish post
    const post = await createGhostPost(ghostToken, title, content, targetDate);
    
    console.log('=====================================');
    console.log('🎉 Deployment completed successfully!');
    console.log(`📊 Records processed: ${records.length}`);
    console.log(`📰 Post published: ${post.url}`);
    
  } catch (error) {
    console.error('=====================================');
    console.error('💥 Deployment failed:', error.message);
    console.error('=====================================');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  deployDailyPost();
}

module.exports = { deployDailyPost };