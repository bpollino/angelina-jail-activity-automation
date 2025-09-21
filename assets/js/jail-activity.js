document.addEventListener('DOMContentLoaded', function() {
    
    // Configure Lightbox options
    if (typeof lightbox !== 'undefined') {
        lightbox.option({
            'resizeDuration': 200,
            'wrapAround': true,
            'albumLabel': 'Image %1 of %2',
            'fadeDuration': 300,
            'imageFadeDuration': 300
        });
    }

    // Handle URL fragments for shared records (Ghost.io integration)
    handleSharedRecordDisplay();

    // Initialize social sharing for individual records
    initializeSocialSharing();

    // Add smooth scrolling for any anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading state for images
    const mugshots = document.querySelectorAll('.mugshot');
    mugshots.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            // Handle broken image links
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA2MEM4Mi4xNzk3IDYwIDg4IDY1LjgyMDMgODggNzNDODggODAuMTc5NyA4Mi4xNzk3IDg2IDc1IDg2QzY3LjgyMDMgODYgNjIgODAuMTc5NyA2MiA3M0M2MiA2NS44MjAzIDY3LjgyMDMgNjAgNzUgNjBaIiBmaWxsPSIjOUNBM0FGII8+CjxwYXRoIGQ9Ik01MCA5MEg5MEM5NS41MjI5IDkwIDEwMCA5NC40NzcxIDEwMCAxMDBWMTIwSDUwVjEwMEM1MCA5NC40NzcxIDU0LjQ3NzEgOTAgNjAgOTBaIiBmaWxsPSIjOUNBM0FGII8+Cjwvc3ZnPgo=';
            this.alt = 'Mugshot not available';
        });
    });

    // Add click tracking for analytics (placeholder)
    const arresteeRecords = document.querySelectorAll('.arrestee-record');
    arresteeRecords.forEach((record, index) => {
        record.addEventListener('click', function(e) {
            // Only track if not clicking on mugshot (lightbox handles that) or share buttons
            if (!e.target.closest('.mugshot-container') && !e.target.closest('.social-sharing')) {
                console.log(`Arrestee record ${index + 1} clicked`);
                // Add analytics tracking here if needed
            }
        });
    });

    // Print functionality
    function addPrintStyles() {
        const printStyles = `
            @media print {
                .mugshot-container a::after {
                    content: " (Image)";
                    font-size: 12px;
                    color: #666;
                }
                .tag {
                    border: 1px solid #007acc;
                    color: #007acc !important;
                    background: transparent !important;
                }
                .social-sharing {
                    display: none;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = printStyles;
        document.head.appendChild(styleSheet);
    }
    
    addPrintStyles();
});

/**
 * Handle URL fragments for shared records (Ghost.io integration)
 * This allows sharing individual records without creating separate pages
 */
function handleSharedRecordDisplay() {
    const hash = window.location.hash;
    
    if (hash && hash.startsWith('#record-')) {
        const recordId = hash.substring(1); // Remove the #
        const targetRecord = document.getElementById(recordId);
        
        if (targetRecord) {
            // Add highlighting class
            targetRecord.classList.add('shared-record');
            
            // Scroll to the record with smooth animation
            setTimeout(() => {
                targetRecord.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100);
            
            // Show notification that we've highlighted the shared record
            showShareNotification(targetRecord);
            
            // Update page meta tags for social sharing
            updateMetaTagsForSharedRecord(targetRecord);
            
            // Remove highlight after a few seconds
            setTimeout(() => {
                targetRecord.classList.remove('shared-record');
            }, 5000);
        }
    }
    
    // Listen for hash changes (in case user navigates to different records)
    window.addEventListener('hashchange', function() {
        // Remove existing highlights
        document.querySelectorAll('.shared-record').forEach(record => {
            record.classList.remove('shared-record');
        });
        
        // Handle new hash
        handleSharedRecordDisplay();
    });
}

/**
 * Show notification that a shared record has been highlighted
 */
function showShareNotification(recordElement) {
    const recordData = extractRecordData(recordElement);
    
    const notification = document.createElement('div');
    notification.className = 'share-notification';
    notification.innerHTML = `
        <span>📍 Showing shared record: ${recordData.name}</span>
        <button class="close-btn" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

/**
 * Update meta tags for shared records (for better social media previews)
 */
function updateMetaTagsForSharedRecord(recordElement) {
    if (!recordElement) return;
    
    const recordData = extractRecordData(recordElement);
    const shareText = createShareText(recordData);
    
    // Update page title
    const originalTitle = document.title;
    document.title = `${recordData.name} - Angelina County Jail Activity`;
    
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name=\"description\"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    metaDescription.content = shareText;
    
    // Update Open Graph tags for Facebook
    updateOrCreateMetaTag('property', 'og:title', `${recordData.name} - Angelina County Jail Activity`);
    updateOrCreateMetaTag('property', 'og:description', shareText);
    updateOrCreateMetaTag('property', 'og:type', 'article');
    
    // Update Twitter Card tags
    updateOrCreateMetaTag('name', 'twitter:title', `${recordData.name} - Angelina County Jail Activity`);
    updateOrCreateMetaTag('name', 'twitter:description', shareText);
    updateOrCreateMetaTag('name', 'twitter:card', 'summary');
    
    // Restore original title after a delay (for better UX if user stays on page)
    setTimeout(() => {
        document.title = originalTitle;
    }, 10000);
}

/**
 * Helper function to update or create meta tags
 */
function updateOrCreateMetaTag(attributeType, attributeValue, content) {
    let meta = document.querySelector(`meta[${attributeType}=\"${attributeValue}\"]`);
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attributeType, attributeValue);
        document.head.appendChild(meta);
    }
    meta.content = content;
}

/**
 * Initialize social sharing functionality for individual arrestee records
 */
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

/**
 * Extract data from an arrestee record
 */
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
        name,
        age,
        city,
        state,
        bookingDate,
        charges,
        recordId: recordElement.dataset.recordId
    };
}

/**
 * Handle sharing based on platform
 */
function handleShare(platform, recordData, recordElement) {
    const baseUrl = window.location.href.split('#')[0];
    const recordUrl = `${baseUrl}#record-${recordData.recordId}`;
    
    // Create shareable content
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
    
    // Track sharing event
    console.log(`Shared ${recordData.name} on ${platform}`);
}

/**
 * Create shareable text content for a record
 */
function createShareText(recordData) {
    const location = recordData.city && recordData.state ? 
        `${recordData.city}, ${recordData.state}` : 
        (recordData.city || recordData.state || 'Angelina County');
    
    const primaryCharge = recordData.charges.length > 0 ? 
        recordData.charges[0].split('(')[0].trim() : 
        'Multiple charges';
    
    return `Angelina County Jail Activity: ${recordData.name}, age ${recordData.age} from ${location} - ${primaryCharge}. Booked ${recordData.bookingDate}`;
}

/**
 * Share on Facebook
 */
function shareFacebook(url, text) {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    openShareWindow(shareUrl, 'Facebook');
}

/**
 * Share on Twitter
 */
function shareTwitter(url, text) {
    const tweetText = text.length > 240 ? text.substring(0, 237) + '...' : text;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;
    openShareWindow(shareUrl, 'Twitter');
}

/**
 * Copy link to clipboard
 */
function copyToClipboard(url, recordElement) {
    navigator.clipboard.writeText(url).then(() => {
        // Visual feedback
        const button = recordElement.querySelector('.copy-link');
        const originalIcon = button.innerHTML;
        
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.classList.remove('copied');
        }, 2000);
        
        // Show temporary tooltip
        showTooltip(button, 'Link copied!');
    }).catch(err => {
        console.error('Failed to copy link:', err);
        // Fallback for older browsers
        fallbackCopyToClipboard(url, recordElement);
    });
}

/**
 * Fallback copy method for older browsers
 */
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
        const button = recordElement.querySelector('.copy-link');
        showTooltip(button, 'Link copied!');
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showTooltip(recordElement.querySelector('.copy-link'), 'Copy failed');
    }
    
    document.body.removeChild(textArea);
}

/**
 * Open share window
 */
function openShareWindow(url, platform) {
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
        url,
        `share-${platform}`,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
}

/**
 * Show temporary tooltip
 */
function showTooltip(element, message) {
    const tooltip = document.createElement('div');
    tooltip.textContent = message;
    tooltip.style.position = 'absolute';
    tooltip.style.background = '#333';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px 8px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = '1000';
    tooltip.style.whiteSpace = 'nowrap';
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = (rect.left + rect.width / 2) + 'px';
    tooltip.style.top = (rect.top - 35) + 'px';
    tooltip.style.transform = 'translateX(-50%)';
    
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
        if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
    }, 2000);
}

// Utility function to format dates consistently
function formatBookingDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        return dateString; // Return original if parsing fails
    }
}

// Function to handle missing mugshot images
function handleMissingMugshot(imgElement) {
    imgElement.style.display = 'none';
    const container = imgElement.closest('.mugshot-container');
    if (container) {
        container.innerHTML = '<div class="no-mugshot">No Image Available</div>';
        container.classList.add('no-image');
    }
}