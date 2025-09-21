#!/usr/bin/env node

/**
 * Simple Ghost Test - Just Basic Text
 */

require('dotenv').config();
const GhostAdminAPI = require('@tryghost/admin-api');

const config = {
    ghost: {
        url: process.env.GHOST_SITE_URL || 'https://angelina-411.ghost.io',
        key: process.env.GHOST_ADMIN_API_KEY,
        version: 'v5.0'
    }
};

const ghostAPI = new GhostAdminAPI({
    url: config.ghost.url,
    key: config.ghost.key,
    version: config.ghost.version
});

async function createSimplePost() {
    try {
        console.log('🧪 Testing simple text post...');
        
        const simpleHTML = `
<p>This is a simple test post to verify Ghost API is working.</p>

<h2>Angelina County Jail Activity - Test</h2>

<div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
    <p><strong>All persons listed below are considered innocent until proven guilty in a court of law.</strong></p>
</div>

<h3>Sample Arrest Record</h3>

<div style="border: 1px solid #ddd; padding: 1rem; margin: 1rem 0; border-radius: 8px;">
    <p><strong>Name:</strong> Smith, John Michael</p>
    <p><strong>Age:</strong> 32</p>
    <p><strong>City:</strong> Lufkin, Texas</p>
    <p><strong>Charges:</strong> Driving While Intoxicated</p>
    <p><strong>Bond:</strong> $2,500</p>
    <p><strong>Status:</strong> Still in custody</p>
</div>

<p><em>This is a test post to verify HTML content is being saved properly.</em></p>`;

        const postData = {
            title: 'Ghost API Test - Simple HTML with Source',
            html: simpleHTML,
            status: 'draft',
            tags: [{ name: 'Test' }],
            source: 'html'  // Tell Ghost this is HTML content
        };

        console.log(`📤 Sending HTML content (${simpleHTML.length} characters)...`);
        
        const response = await ghostAPI.posts.add(postData);
        
        console.log('✅ Simple post created!');
        console.log(`📰 Title: ${response.title}`);
        console.log(`🆔 Post ID: ${response.id}`);
        console.log(`🔗 Edit URL: ${config.ghost.url}/ghost/#/editor/post/${response.id}`);
        console.log(`📝 Status: ${response.status}`);
        
        // Check what came back
        if (response.html) {
            console.log(`✅ HTML content saved: ${response.html.length} characters`);
        } else if (response.mobiledoc) {
            console.log(`📱 Mobiledoc format used: ${response.mobiledoc.length} characters`);
        } else {
            console.log('❌ No content found in response');
        }

        return response;

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

createSimplePost().catch(console.error);