#!/usr/bin/env node

/**
 * Angelina County Jail Activity Article Generator
 * 
 * This script:
 * 1. Fetches yesterday's booking data from Airtable
 * 2. Generates a formatted HTML article
 * 3. Publishes it to angelina411.com via Ghost API
 * 
 * Designed to run daily via GitHub Actions
 */

require('dotenv').config();
const Airtable = require('airtable');
const GhostAdminAPI = require('@tryghost/admin-api');
const { fetchActiveAdvertisement } = require('./ad-manager');

// Configuration
const config = {
    airtable: {
        apiKey: process.env.AIRTABLE_API_KEY,
        baseId: process.env.AIRTABLE_BASE_ID,
        tableId: process.env.AIRTABLE_TABLE_ID || 'tblq3cgwhhPPjffEi',
        viewId: process.env.AIRTABLE_VIEW_ID || 'viw17thlqxwsSvaVF',
        tableName: process.env.AIRTABLE_TABLE_NAME || 'Jail Records',
        adTableName: process.env.AIRTABLE_AD_TABLE_NAME || 'Advertisements'
    },
    ghost: {
        url: process.env.GHOST_SITE_URL || 'https://angelina-411.ghost.io',
        key: process.env.GHOST_ADMIN_API_KEY,
        contentKey: process.env.GHOST_CONTENT_API_KEY,
        version: 'v5.0'
    },
    articleDate: process.env.ARTICLE_DATE // Optional override for date
};

// Initialize APIs
const airtable = new Airtable({ apiKey: config.airtable.apiKey });
const ghostAPI = new GhostAdminAPI({
    url: config.ghost.url,
    key: config.ghost.key,
    version: config.ghost.version
});

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('🚀 Starting jail activity article generation...');
        
        // Determine target date (yesterday by default)
        const targetDate = getTargetDate();
        console.log(`📅 Generating article for: ${targetDate.toDateString()}`);
        
        // Fetch booking data from Airtable
        console.log('📊 Fetching booking data from Airtable...');
        const bookingData = await fetchBookingData(targetDate);
        console.log(`✅ Found ${bookingData.length} booking records`);
        
        // Fetch current advertisement
        console.log('📢 Fetching advertisement data from Airtable...');
        const adData = await fetchActiveAdvertisement();
        if (adData) {
            console.log(`✅ Found advertisement: ${adData.title}`);
            if (adData.isFallback) {
                console.log('⚠️  Using fallback advertisement (Airtable connection failed)');
            }
        } else {
            console.log('ℹ️  No active advertisement found');
        }
        
        if (bookingData.length === 0) {
            console.log('ℹ️  No booking records found for this date. Skipping article generation.');
            return;
        }
        
        // Generate article content
        console.log('📝 Generating article content...');
        const articleContent = generateArticleHTML(bookingData, targetDate, adData);
        
        // Publish to Ghost
        console.log('🌐 Publishing article to Ghost...');
        const publishedPost = await publishToGhost(articleContent, targetDate);
        
        console.log('🎉 Article published successfully!');
        console.log(`📄 Title: ${publishedPost.title}`);
        console.log(`🔗 URL: ${publishedPost.url}`);
        
    } catch (error) {
        console.error('❌ Error generating article:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

/**
 * Get the target date for the article
 */
function getTargetDate() {
    if (config.articleDate) {
        return new Date(config.articleDate);
    }
    
    // Default to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
}

/**
 * Fetch current advertisement data from Airtable
 * @deprecated - Now using fetchActiveAdvertisement from ad-manager.js
 */
async function fetchAdvertisementData() {
    console.log('⚠️  fetchAdvertisementData is deprecated. Use fetchActiveAdvertisement from ad-manager.js');
    return await fetchActiveAdvertisement();
}

/**
 * Fetch booking data from Airtable for the target date
 */
async function fetchBookingData(targetDate) {
    const base = airtable.base(config.airtable.baseId);
    const table = base(config.airtable.tableId);
    
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);
    
    const records = await table.select({
        filterByFormula: `AND(
            IS_AFTER({Booking Date}, '${startDate.toISOString()}'),
            IS_BEFORE({Booking Date}, '${endDate.toISOString()}')
        )`,
        sort: [{ field: 'Booking Date', direction: 'asc' }]
    }).all();
    
    return records.map(record => ({
        id: record.id,
        name: record.get('Name') || 'Unknown',
        age: record.get('Age') || 'Unknown',
        height: record.get('Height') || '',
        weight: record.get('Weight') || '',
        sex: record.get('Sex') || '',
        race: record.get('Race') || '',
        eyeColor: record.get('Eye Color') || '',
        hairColor: record.get('Hair Color') || '',
        bookingDate: record.get('Booking Date'),
        releaseDate: record.get('Release Date'), // May not exist
        charges: parseCharges(record.get('Offenses'), record.get('Bond Amounts')),
        mugshot: record.get('Mugshot URL') || null,
        detailLink: record.get('Detail Link') || null,
        arrestingAgency: record.get('Arresting Agencies') || ''
    }));
}

/**
 * Parse charges field (handling separate Offenses and Bond Amounts fields)
 */
function parseCharges(offensesField, bondAmountsField) {
    if (!offensesField) return [];
    
    // Split offenses and bond amounts
    const offenses = offensesField.split(';').map(offense => offense.trim()).filter(Boolean);
    const bonds = bondAmountsField ? bondAmountsField.split(';').map(bond => bond.trim()).filter(Boolean) : [];
    
    return offenses.map((offense, index) => {
        // Extract bond amount (remove $ and convert to number)
        const bondText = bonds[index] || '$0';
        const bondMatch = bondText.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        const bond = bondMatch ? parseFloat(bondMatch[1].replace(/,/g, '')) : 0;
        
        return { 
            description: offense,
            bond: '' // Remove bond display entirely
        };
    });
}

/**
 * Generate HTML content for the article
 */
function generateArticleHTML(bookingData, targetDate, adData = null) {
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

    ${adData ? `
        <div class="advertisement-section" style="display: flex; flex-direction: column; gap: 15px; margin: 30px 0; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; background-color: #fafafa; position: relative;">
            <style>
                @media (min-width: 768px) {
                    .advertisement-section {
                        flex-direction: row !important;
                        gap: 20px !important;
                    }
                    .advertisement-section .ad-image-container {
                        flex-shrink: 0 !important;
                    }
                    .advertisement-section .ad-content {
                        flex: 1 !important;
                    }
                }
            </style>
            <div class="ad-image-container" style="align-self: center;">
                ${adData.imageUrl ? `
                    <div style="width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 6px; border: 2px solid #ddd; overflow: hidden;">
                        <img src="${adData.imageUrl}" alt="${adData.title}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4px;">
                    </div>
                ` : `
                    <div style="width: 150px; height: 150px; background: linear-gradient(135deg, #007acc 0%, #0056b3 100%); border-radius: 6px; border: 2px solid #ddd; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; text-align: center; font-size: 11px; padding: 10px; box-sizing: border-box;">
                        <div style="font-size: 24px; margin-bottom: 8px;">📢</div>
                        <div style="line-height: 1.3;">Advertisement</div>
                    </div>
                `}
            </div>
            <div class="ad-content" style="flex: 1; min-width: 0; padding-bottom: 50px;">
                <p><strong>Advertisement:</strong> <span style="color: #007acc; font-weight: bold;">${adData.title}</span></p>
                <p><strong>Description:</strong> ${adData.description}</p>
                <div style="margin-top: 15px;">
                    <a href="${adData.link}" target="_blank" 
                       style="background: #007acc; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 14px;">
                        ${adData.buttonText || 'Learn More'}
                    </a>
                </div>
                
                <!-- Ad identifier in bottom right -->
                <div style="position: absolute; bottom: 15px; right: 15px; opacity: 0.5;">
                    <span style="background: #007acc; color: white; padding: 4px 8px; border-radius: 3px; font-size: 10px;">
                        AD
                    </span>
                </div>
            </div>
        </div>
    ` : ''}
    `;
    
    // Add advertisement if available
    if (adData && adData.imageUrl) {
        html += `
            <div style="margin: 30px 0; text-align: center; background-color: #fff; border: 1px solid #e1e1e1; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; font-weight: 500;">Advertisement</div>
                <a href="${adData.linkUrl}" target="_blank" style="display: block; text-decoration: none;">
                    <img src="${adData.imageUrl}" alt="${adData.altText}" style="max-width: 100%; height: auto; border-radius: 4px; border: none; display: block; margin: 0 auto;">
                </a>
            </div>
        `;
    }
    
    bookingData.forEach((arrestee, index) => {
        html += generateArresteeHTML(arrestee, index);
    });
    
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
                name, age, bookingDate, charges,
                recordId: recordElement.dataset.recordId
            };
        }

        function handleShare(platform, recordData, recordElement) {
            const baseUrl = window.location.href.split('#')[0];
            const recordUrl = baseUrl + '#' + recordData.recordId;
            const shareText = createShareText(recordData);
            
            switch(platform) {
                case 'facebook':
                    shareFacebook(recordUrl, shareText);
                    break;
                case 'twitter':
                    shareTwitter(recordUrl, shareText);
                    break;
                case 'copy':
                    copyToClipboard(recordUrl, recordElement);
                    break;
            }
        }

        function createShareText(recordData) {
            const primaryCharge = recordData.charges.length > 0 ? 
                recordData.charges[0].split('(')[0].trim() : 
                'Multiple charges';
            
            return 'Angelina County Jail Activity: ' + recordData.name + ', age ' + recordData.age + ' - ' + primaryCharge + '. Booked ' + recordData.bookingDate;
        }

        function shareFacebook(url, text) {
            const shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '&quote=' + encodeURIComponent(text);
            openShareWindow(shareUrl, 'Facebook');
        }

        function shareTwitter(url, text) {
            const tweetText = text.length > 240 ? text.substring(0, 237) + '...' : text;
            const shareUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(tweetText) + '&url=' + encodeURIComponent(url);
            openShareWindow(shareUrl, 'Twitter');
        }

        function copyToClipboard(url, recordElement) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(function() {
                    showCopyFeedback(recordElement);
                }).catch(function(err) {
                    fallbackCopyToClipboard(url, recordElement);
                });
            } else {
                fallbackCopyToClipboard(url, recordElement);
            }
        }

        function fallbackCopyToClipboard(text, recordElement) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                showCopyFeedback(recordElement);
            } catch (err) {
                console.error('Copy failed:', err);
            }
            
            document.body.removeChild(textArea);
        }

        function showCopyFeedback(recordElement) {
            const button = recordElement.querySelector('.copy-link');
            const originalHTML = button.innerHTML;
            
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            button.style.background = '#28a745';
            
            setTimeout(function() {
                button.innerHTML = originalHTML;
                button.style.background = '#6c757d';
            }, 2000);
        }

        function openShareWindow(url, platform) {
            const width = 600;
            const height = 400;
            const left = (window.innerWidth - width) / 2;
            const top = (window.innerHeight - height) / 2;
            
            window.open(
                url,
                'share-' + platform,
                'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',resizable=yes,scrollbars=yes'
            );
        }
        
        // Handle individual record navigation
        window.addEventListener('load', function() {
            // Check if there's a hash in the URL for individual record
            if (window.location.hash) {
                const targetElement = document.querySelector(window.location.hash);
                if (targetElement) {
                    // Hide all other records
                    const allRecords = document.querySelectorAll('.arrestee-record');
                    allRecords.forEach(record => {
                        if (record.id !== window.location.hash.substring(1)) {
                            record.style.display = 'none';
                        }
                    });
                    
                    // Scroll to the target record
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // Add a "View All Records" button
                    const viewAllButton = document.createElement('div');
                    viewAllButton.innerHTML = 
                        '<div style="text-align: center; margin: 20px 0; padding: 15px; background: #e3f2fd; border-radius: 8px;">' +
                            '<button onclick="showAllRecords()" style="background: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">' +
                                '← View All Records' +
                            '</button>' +
                        '</div>';
                    targetElement.parentNode.insertBefore(viewAllButton, targetElement);
                }
            }
        });
        
        function showAllRecords() {
            // Show all records again
            const allRecords = document.querySelectorAll('.arrestee-record');
            allRecords.forEach(record => {
                record.style.display = 'flex';
            });
            
            // Remove the "View All" button
            const viewAllButton = document.querySelector('div[style*="background: #e3f2fd"]');
            if (viewAllButton) {
                viewAllButton.remove();
            }
            
            // Clear the hash from URL
            history.pushState('', document.title, window.location.pathname + window.location.search);
        }
        </script>
    `;
    
    return html;
}

/**
 * Generate HTML for individual arrestee
 */
function generateArresteeHTML(arrestee, index = 0) {
    // Generate unique record ID for sharing
    const recordId = `record-${Date.now()}-${index}`;
    
    const chargesList = arrestee.charges.map(charge => 
        `<li>${charge.description}</li>`
    ).join('');
    
    // Improved mugshot handling with better placeholder design
    const mugshotHTML = arrestee.mugshot 
        ? `<a href="${arrestee.mugshot}" data-lightbox="mugshots" data-title="${arrestee.name}">
            <img src="${arrestee.mugshot}" 
                 alt="Mugshot of ${arrestee.name}" 
                 style="width: 150px; height: 180px; object-fit: cover; border-radius: 6px; border: 2px solid #ddd;"
                 onerror="this.style.display='none'; this.parentElement.nextElementSibling.style.display='flex';">
           </a>
           <div style="display: none; width: 150px; height: 180px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 6px; border: 2px dashed #dee2e6; flex-direction: column; align-items: center; justify-content: center; color: #6c757d; text-align: center; font-size: 11px; padding: 10px; box-sizing: border-box;">
                <div style="font-size: 24px; margin-bottom: 8px; opacity: 0.5;">📷</div>
                <div style="line-height: 1.3;">Photo Not<br>Available</div>
            </div>`
        : `<div style="width: 150px; height: 180px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 6px; border: 2px dashed #dee2e6; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #6c757d; text-align: center; font-size: 11px; padding: 10px; box-sizing: border-box;">
            <div style="font-size: 24px; margin-bottom: 8px; opacity: 0.5;">📷</div>
            <div style="line-height: 1.3;">Photo Not<br>Available</div>
        </div>`;
    
    // Only show Released field if there's actually release data
    const releaseInfo = arrestee.releaseDate 
        ? `<p><strong>Released:</strong> <span class="release-date">${formatBookingDate(arrestee.releaseDate)}</span></p>`
        : '';
    
    return `
        <div class="arrestee-record" id="${recordId}" data-record-id="${recordId}" style="display: flex; flex-direction: column; gap: 15px; margin: 30px 0; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; background-color: #fafafa; position: relative;">
            <!-- Arrestee record specific responsive styling -->
            <style>
                @media (min-width: 768px) {
                    .arrestee-record {
                        flex-direction: row !important;
                        gap: 20px !important;
                    }
                    .arrestee-record .mugshot-container {
                        flex-shrink: 0 !important;
                    }
                    .arrestee-record .arrestee-details {
                        flex: 1 !important;
                    }
                }
            </style>
            <div class="mugshot-container" style="align-self: center;">
                ${mugshotHTML}
            </div>
            <div class="arrestee-details" style="flex: 1; min-width: 0; padding-bottom: 50px;">
                <p><strong>Name:</strong> <span class="arrestee-name">${arrestee.name}</span></p>
                <p><strong>Age:</strong> <span class="arrestee-age">${arrestee.age}</span></p>
                <p><strong>Height:</strong> <span class="arrestee-height">${arrestee.height}</span></p>
                <p><strong>Weight:</strong> <span class="arrestee-weight">${arrestee.weight}</span></p>
                <p><strong>Booked:</strong> <span class="booking-date">${formatBookingDate(arrestee.bookingDate)}</span></p>
                ${releaseInfo}
                ${chargesList ? `
                <div style="margin-top: 15px;">
                    <p><strong>Charges:</strong></p>
                    <ul class="charges-list" style="margin: 8px 0; padding-left: 20px;">
                        ${chargesList}
                    </ul>
                </div>
                ` : ''}
                
                <!-- Social Sharing Buttons - Bottom Right -->
                <div class="social-sharing" style="position: absolute; bottom: 15px; right: 15px; display: flex; gap: 6px; opacity: 0.7;">
                    <button class="share-btn facebook-share" data-platform="facebook" 
                            style="background: #666; color: white; border: none; padding: 6px 8px; border-radius: 3px; cursor: pointer; font-size: 11px; display: flex; align-items: center; transition: opacity 0.2s;"
                            onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="Share on Facebook">
                        <i class="fab fa-facebook-f"></i>
                    </button>
                    <button class="share-btn twitter-share" data-platform="twitter" 
                            style="background: #666; color: white; border: none; padding: 6px 8px; border-radius: 3px; cursor: pointer; font-size: 11px; display: flex; align-items: center; transition: opacity 0.2s;"
                            onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="Share on Twitter">
                        <i class="fab fa-twitter"></i>
                    </button>
                    <button class="share-btn copy-link" data-platform="copy" 
                            style="background: #666; color: white; border: none; padding: 6px 8px; border-radius: 3px; cursor: pointer; font-size: 11px; display: flex; align-items: center; transition: opacity 0.2s;"
                            onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="Copy Link">
                        <i class="fas fa-link"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Publish article to Ghost
 */
async function publishToGhost(htmlContent, targetDate) {
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    const title = `Angelina County Jail Activity - ${dayOfWeek}`;
    
    const post = {
        title,
        html: htmlContent,
        tags: ['Jail', 'Booking', 'Community Activities'],
        status: 'published',
        featured: false,
        meta_title: title,
        meta_description: `Daily jail booking activity for Angelina County. Booking data provided by courtesy of the Angelina County Sheriff's Department.`,
        og_title: title,
        og_description: `Daily jail booking activity for Angelina County.`,
        published_at: new Date().toISOString()
    };
    
    return await ghostAPI.posts.add(post);
}

/**
 * Format booking date for display in MM/DD/YYYY HH:MM format
 */
function formatBookingDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { main, fetchBookingData, fetchAdvertisementData, generateArticleHTML, publishToGhost };