#!/usr/bin/env node

/**
 * Local Development Server
 * 
 * This server allows you to test the jail activity article generation
 * and preview the results in a browser before deploying to production.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

// Import our modules
const { mockBookingData, mockAdvertisementData, mockScenarios } = require('../data/mock-data');
const adRoutes = require('./ad-routes');

const app = express();
const PORT = process.env.LOCAL_PORT || 3000;
const HOST = process.env.LOCAL_HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../')));

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/templates', express.static(path.join(__dirname, '../templates')));

// Advertisement management routes
app.use('/api', adRoutes);

// Serve advertiser submission form
app.get('/advertise', (req, res) => {
    res.sendFile(path.join(__dirname, '../advertiser-form.html'));
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin-dashboard.html'));
});

// API Routes for testing

// Get mock booking data
app.get('/api/booking-data', (req, res) => {
    const scenario = req.query.scenario || 'default';
    let data = mockBookingData;
    
    if (mockScenarios[scenario]) {
        data = mockScenarios[scenario];
    }
    
    res.json({
        success: true,
        data: data,
        count: data.length,
        scenario: scenario
    });
});

// Get mock advertisement data
app.get('/api/advertisement-data', (req, res) => {
    res.json({
        success: true,
        data: mockAdvertisementData
    });
});

// Generate article preview
app.get('/api/generate-preview', async (req, res) => {
    try {
        // Import the generation function
        const { generateArticleHTML } = require('../scripts/generate-article');
        
        const scenario = req.query.scenario || 'default';
        const targetDate = new Date(req.query.date || '2023-12-19');
        
        let bookingData = mockBookingData;
        if (mockScenarios[scenario]) {
            bookingData = mockScenarios[scenario];
        }
        
        const htmlContent = generateArticleHTML(bookingData, targetDate, mockAdvertisementData);
        
        res.json({
            success: true,
            html: htmlContent,
            metadata: {
                recordCount: bookingData.length,
                scenario: scenario,
                date: targetDate.toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error generating preview:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve development preview page
app.get('/preview', (req, res) => {
    const scenario = req.query.scenario || 'default';
    const date = req.query.date || '2023-12-19';
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jail Activity Preview - Local Development</title>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Lightbox CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/css/lightbox.min.css">
    
    <!-- Local CSS -->
    <link rel="stylesheet" href="/assets/css/jail-activity.css">
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        
        .dev-header {
            background: #007acc;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .dev-controls {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .preview-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        select, input {
            padding: 8px 12px;
            margin: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        button {
            background: #007acc;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        
        button:hover {
            background: #0056b3;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="dev-header">
        <h1>🚧 Local Development Preview</h1>
        <p>Test your jail activity articles before deploying to production</p>
    </div>
    
    <div class="dev-controls">
        <h3>Preview Controls</h3>
        <label>
            Scenario:
            <select id="scenarioSelect">
                <option value="default" ${scenario === 'default' ? 'selected' : ''}>Default (5 records)</option>
                <option value="noArrests" ${scenario === 'noArrests' ? 'selected' : ''}>No Arrests</option>
                <option value="singleArrest" ${scenario === 'singleArrest' ? 'selected' : ''}>Single Arrest</option>
                <option value="manyArrests" ${scenario === 'manyArrests' ? 'selected' : ''}>Many Arrests</option>
                <option value="noMugshots" ${scenario === 'noMugshots' ? 'selected' : ''}>No Mugshots</option>
                <option value="allReleased" ${scenario === 'allReleased' ? 'selected' : ''}>All Released</option>
            </select>
        </label>
        
        <label>
            Date:
            <input type="date" id="dateInput" value="${date}">
        </label>
        
        <button onclick="refreshPreview()">🔄 Refresh Preview</button>
        <button onclick="testSharing()">🔗 Test Sharing</button>
        <button onclick="viewData()">📊 View Data</button>
    </div>
    
    <div class="preview-container">
        <div id="previewContent" class="loading">
            <i class="fas fa-spinner fa-spin"></i> Loading preview...
        </div>
    </div>
    
    <!-- Lightbox JavaScript -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/js/lightbox.min.js"></script>
    
    <!-- Local JavaScript -->
    <script src="/assets/js/jail-activity.js"></script>
    
    <script>
        // Load initial preview
        document.addEventListener('DOMContentLoaded', function() {
            refreshPreview();
        });
        
        function refreshPreview() {
            const scenario = document.getElementById('scenarioSelect').value;
            const date = document.getElementById('dateInput').value;
            const previewContent = document.getElementById('previewContent');
            
            previewContent.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Generating preview...</div>';
            
            fetch(\`/api/generate-preview?scenario=\${scenario}&date=\${date}\`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        previewContent.innerHTML = data.html;
                        
                        // Reinitialize social sharing after content load
                        if (typeof initializeSocialSharing === 'function') {
                            initializeSocialSharing();
                        }
                        
                        // Handle shared record display
                        if (typeof handleSharedRecordDisplay === 'function') {
                            handleSharedRecordDisplay();
                        }
                        
                        console.log('Preview loaded:', data.metadata);
                    } else {
                        previewContent.innerHTML = \`<div style="padding: 20px; color: red;">Error: \${data.error}</div>\`;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    previewContent.innerHTML = '<div style="padding: 20px; color: red;">Failed to load preview</div>';
                });
        }
        
        function testSharing() {
            alert('Social sharing test - in production this would open social media platforms');
            console.log('Testing social sharing functionality');
        }
        
        function viewData() {
            const scenario = document.getElementById('scenarioSelect').value;
            window.open(\`/api/booking-data?scenario=\${scenario}\`, '_blank');
        }
        
        // Update URL when controls change
        document.getElementById('scenarioSelect').addEventListener('change', function() {
            const url = new URL(window.location);
            url.searchParams.set('scenario', this.value);
            window.history.pushState({}, '', url);
        });
        
        document.getElementById('dateInput').addEventListener('change', function() {
            const url = new URL(window.location);
            url.searchParams.set('date', this.value);
            window.history.pushState({}, '', url);
        });
    </script>
</body>
</html>
    `;
    
    res.send(html);
});

// Main development page
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Angelina County Jail Activity - Local Development</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
        }
        
        .header {
            text-align: center;
            background: linear-gradient(135deg, #007acc, #0056b3);
            color: white;
            padding: 40px 20px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        
        .nav-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .nav-card {
            background: white;
            border: 1px solid #e1e1e1;
            border-radius: 8px;
            padding: 20px;
            text-decoration: none;
            color: #333;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .nav-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            text-decoration: none;
            color: #007acc;
        }
        
        .nav-card h3 {
            margin-top: 0;
            color: #007acc;
        }
        
        .status {
            background: #f8f9fa;
            border-left: 4px solid #28a745;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏛️ Angelina County Jail Activity</h1>
        <p>Local Development Environment</p>
    </div>
    
    <div class="status">
        <strong>✅ Development Server Running</strong><br>
        Server: http://${HOST}:${PORT}<br>
        Node.js: ${process.version}<br>
        Environment: ${process.env.NODE_ENV || 'development'}
    </div>
    
    <div class="nav-grid">
        <a href="/preview" class="nav-card">
            <h3>📱 Article Preview</h3>
            <p>Live preview of generated jail activity articles with different scenarios and test data</p>
        </a>
        
        <a href="/api/booking-data" class="nav-card">
            <h3>📊 Mock Data</h3>
            <p>View the mock booking data used for development and testing</p>
        </a>
        
        <a href="/test-social-sharing.html" class="nav-card">
            <h3>🔗 Social Sharing Test</h3>
            <p>Test individual record sharing functionality and social media integration</p>
        </a>
        
        <a href="/templates/jail-activity.html" class="nav-card">
            <h3>🎨 HTML Template</h3>
            <p>View the base HTML template structure for articles</p>
        </a>
    </div>
    
    <div style="text-align: center; margin-top: 40px; color: #666;">
        <p>Ready to develop and test your jail activity article generator!</p>
        <p><strong>Next:</strong> Try the <a href="/preview">Article Preview</a> to see your generated content</p>
    </div>
</body>
</html>
    `);
});

// Serve real data test output
app.get('/real-data', (req, res) => {
    const path = require('path');
    const fs = require('fs');
    
    const filePath = path.join(__dirname, '../output/real-data-test.html');
    
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.status(404).send(`
            <html>
                <head><title>Real Data Not Found</title></head>
                <body style="font-family: system-ui; padding: 40px; text-align: center;">
                    <h1>⚠️ Real Data Test File Not Found</h1>
                    <p>Run the real API test first:</p>
                    <code>node scripts/test-real-apis.js</code>
                    <br><br>
                    <a href="/">← Back to Home</a>
                </body>
            </html>
        `);
    }
});

// Serve real data with ad test output
app.get('/real-data-with-ad', (req, res) => {
    const path = require('path');
    const fs = require('fs');
    
    const filePath = path.join(__dirname, '../output/real-data-with-ad-test.html');
    
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.status(404).send(`
            <html>
                <head><title>Ad Test Not Found</title></head>
                <body style="font-family: system-ui; padding: 40px; text-align: center;">
                    <h1>⚠️ Ad Test File Not Found</h1>
                    <p>Run the ad test first:</p>
                    <code>node scripts/test-with-ad.js</code>
                    <br><br>
                    <a href="/">← Back to Home</a>
                </body>
            </html>
        `);
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, HOST, () => {
    console.log(`\n🚀 Local Development Server Running`);
    console.log(`\n📍 Server Details:`);
    console.log(`   URL: http://${HOST}:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Node.js: ${process.version}`);
    console.log(`\n🔗 Quick Links:`);
    console.log(`   Main: http://${HOST}:${PORT}/`);
    console.log(`   Preview: http://${HOST}:${PORT}/preview`);
    console.log(`   Mock Data: http://${HOST}:${PORT}/api/booking-data`);
    console.log(`   Social Test: http://${HOST}:${PORT}/test-social-sharing.html`);
    console.log(`\n💡 Press Ctrl+C to stop the server\n`);
});

module.exports = app;