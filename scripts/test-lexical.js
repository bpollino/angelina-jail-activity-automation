#!/usr/bin/env node

/**
 * Test using Ghost's Lexical format instead of HTML
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

async function createLexicalPost() {
    try {
        console.log('🧪 Testing with Lexical format...');
        
        // Create content in Ghost's Lexical format
        const lexicalContent = JSON.stringify({
            root: {
                children: [
                    {
                        children: [
                            {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "Angelina County Jail Activity - Test",
                                type: "text",
                                version: 1
                            }
                        ],
                        direction: "ltr",
                        format: "",
                        indent: 0,
                        type: "heading",
                        version: 1,
                        tag: "h2"
                    },
                    {
                        children: [
                            {
                                detail: 0,
                                format: 1,
                                mode: "normal",
                                style: "",
                                text: "All persons listed below are considered innocent until proven guilty in a court of law.",
                                type: "text",
                                version: 1
                            }
                        ],
                        direction: "ltr",
                        format: "",
                        indent: 0,
                        type: "paragraph",
                        version: 1
                    },
                    {
                        children: [
                            {
                                detail: 0,
                                format: 1,
                                mode: "normal",
                                style: "",
                                text: "Name: ",
                                type: "text",
                                version: 1
                            },
                            {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "Smith, John Michael",
                                type: "text",
                                version: 1
                            }
                        ],
                        direction: "ltr",
                        format: "",
                        indent: 0,
                        type: "paragraph",
                        version: 1
                    },
                    {
                        children: [
                            {
                                detail: 0,
                                format: 1,
                                mode: "normal",
                                style: "",
                                text: "Age: ",
                                type: "text",
                                version: 1
                            },
                            {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "32",
                                type: "text",
                                version: 1
                            }
                        ],
                        direction: "ltr",
                        format: "",
                        indent: 0,
                        type: "paragraph",
                        version: 1
                    },
                    {
                        children: [
                            {
                                detail: 0,
                                format: 1,
                                mode: "normal",
                                style: "",
                                text: "Charges: ",
                                type: "text",
                                version: 1
                            },
                            {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "Driving While Intoxicated",
                                type: "text",
                                version: 1
                            }
                        ],
                        direction: "ltr",
                        format: "",
                        indent: 0,
                        type: "paragraph",
                        version: 1
                    }
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "root",
                version: 1
            }
        });

        const postData = {
            title: 'Lexical Format Test ' + Date.now(),
            lexical: lexicalContent
        };

        console.log('📤 Sending Lexical content...');
        
        const response = await ghostAPI.posts.add(postData);
        
        console.log('✅ Post created!');
        console.log(`🆔 Post ID: ${response.id}`);
        console.log(`🔗 URL: ${config.ghost.url}/ghost/#/editor/post/${response.id}`);
        
        // Fetch it back
        console.log('\n🔍 Fetching post back...');
        const fetchedPost = await ghostAPI.posts.read({id: response.id}, {formats: ['html', 'lexical']});
        
        if (fetchedPost.html) {
            console.log('✅ HTML generated from Lexical:', fetchedPost.html.substring(0, 300));
        }
        
        if (fetchedPost.lexical) {
            console.log('✅ Lexical content preserved');
        }

        return response;

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

createLexicalPost().catch(console.error);