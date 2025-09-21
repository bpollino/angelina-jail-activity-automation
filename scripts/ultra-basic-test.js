#!/usr/bin/env node

/**
 * Ultra Simple Ghost Test - Just Plain Text
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

async function createBasicPost() {
    try {
        console.log('🧪 Testing ultra-basic post...');
        
        // Try the absolute simplest content first
        const basicContent = `
        <p>This is a test post.</p>
        <h2>Jail Activity Test</h2>
        <p>John Smith, age 32, was arrested for DWI.</p>
        <p>Bond: $2,500</p>
        `;

        const postData = {
            title: 'Ultra Basic Test ' + Date.now(),
            html: basicContent.trim()
        };

        console.log('📤 Sending basic content...');
        console.log('Content:', basicContent);
        
        const response = await ghostAPI.posts.add(postData);
        
        console.log('✅ Post created!');
        console.log(`🆔 Post ID: ${response.id}`);
        console.log(`🔗 URL: ${config.ghost.url}/ghost/#/editor/post/${response.id}`);
        
        // Now try to fetch it back to see if content is there
        console.log('\n🔍 Fetching post back to check content...');
        const fetchedPost = await ghostAPI.posts.read({id: response.id}, {formats: ['html', 'mobiledoc']});
        
        console.log('📋 Fetched post fields:', Object.keys(fetchedPost));
        
        if (fetchedPost.html) {
            console.log('✅ HTML content found:', fetchedPost.html.substring(0, 200));
        } else {
            console.log('❌ No HTML content in fetched post');
            console.log('HTML field value:', fetchedPost.html);
        }
        
        if (fetchedPost.mobiledoc) {
            console.log('📱 Mobiledoc found:', fetchedPost.mobiledoc.substring(0, 400));
            try {
                const parsed = JSON.parse(fetchedPost.mobiledoc);
                console.log('📱 Parsed mobiledoc structure:', JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log('❌ Could not parse mobiledoc');
            }
        }

        return response;

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.context) console.error('Context:', error.context);
        throw error;
    }
}

createBasicPost().catch(console.error);