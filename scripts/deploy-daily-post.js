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
    tableName: process.env.AIRTABLE_TABLE_NAME || 'Angelina County Jail Activity'
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
    const table = base(config.airtable.tableName);
    
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
      filterByFormula: `IS_SAME({Booking Date}, DATETIME_PARSE("${targetDate}", "YYYY-MM-DD"), "day")`,
      sort: [{ field: 'Booking Date', direction: 'desc' }]
    }).all();
    
    console.log(`📋 Found ${records.length} booking records for ${targetDate}`);
    
    if (records.length === 0) {
      console.log('ℹ️ No records found for target date. This may be normal for weekends or holidays.');
    }
    
    return records;
  } catch (error) {
    console.error('❌ Failed to fetch booking records:', error.message);
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
  // This would contain the same content generation logic from your test script
  // For brevity, I'll include a simplified version here
  
  const title = generatePostTitle(targetDate);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(targetDate + 'T12:00:00Z');
  const dayName = dayNames[date.getDay()];
  
  let content = {
    version: "0.15.0",
    root: {
      type: "root",
      format: "",
      indent: 0,
      children: [
        // Warning callout
        {
          type: "callout",
          format: "",
          indent: 0,
          backgroundColor: "yellow",
          icon: "⚠️",
          children: [
            {
              type: "paragraph",
              format: "",
              indent: 0,
              children: [
                {
                  type: "text",
                  format: 0,
                  style: "",
                  text: "All person(s) listed below are considered innocent until proven guilty in a court of law.",
                  detail: 0,
                  mode: "normal"
                }
              ],
              direction: "ltr"
            }
          ],
          direction: "ltr"
        },
        // Introduction paragraph
        {
          type: "paragraph",
          format: "",
          indent: 0,
          children: [
            {
              type: "text",
              format: 0,
              style: "",
              text: `The following individuals were arrested and booked in Angelina County on ${dayName}, ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. This information is derived from public records provided by the Angelina County Sheriff's Department and reflects booking activity only.`,
              detail: 0,
              mode: "normal"
            }
          ],
          direction: "ltr"
        }
      ]
    }
  };
  
  // Add record cards (simplified - you'd include the full HTML generation logic here)
  if (records.length === 0) {
    content.root.children.push({
      type: "paragraph",
      format: "",
      indent: 0,
      children: [
        {
          type: "text",
          format: 1, // bold
          style: "",
          text: "No arrest records found for this date.",
          detail: 0,
          mode: "normal"
        }
      ],
      direction: "ltr"
    });
  } else {
    // Add each record as an HTML card (you'd include the full generation logic here)
    records.forEach(record => {
      // Include the full HTML card generation from your test script
      // This is where you'd add the arrestee cards with photos, details, charges, etc.
    });
  }
  
  // Add closing information
  content.root.children.push(
    {
      type: "paragraph",
      format: "",
      indent: 0,
      children: [
        {
          type: "text",
          format: 0,
          style: "",
          text: "This information is compiled from public records and is provided for informational purposes only. For questions about specific cases or to report corrections, please contact the Angelina County Sheriff's Department directly.",
          detail: 0,
          mode: "normal"
        }
      ],
      direction: "ltr"
    }
  );
  
  return content;
}

// Create and publish Ghost post
async function createGhostPost(ghostToken, title, content, targetDate) {
  try {
    console.log('📝 Creating Ghost post...');
    
    const postData = {
      posts: [{
        title: title,
        status: 'published', // Publish automatically
        tags: ['Jail', 'Booking', 'Community Activities', 'Local News'],
        lexical: JSON.stringify(content),
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