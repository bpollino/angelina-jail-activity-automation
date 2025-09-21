// Ghost API Publishing Example
// This shows how to publish the jail activity content to Ghost

const GhostAdminAPI = require('@tryghost/admin-api');

// Initialize Ghost Admin API
const api = new GhostAdminAPI({
    url: 'https://www.angelina411.com', // Your Ghost site URL
    key: 'YOUR_ADMIN_API_KEY', // Get from Ghost Admin -> Integrations
    version: 'v5.0'
});

// Function to create jail activity post
async function publishJailActivity(arrestData, date) {
    
    // Generate HTML content from template
    const htmlContent = generateJailActivityHTML(arrestData, date);
    
    // Create post object
    const post = {
        title: `Angelina County Jail Activity - ${getDayOfWeek(date)}`,
        html: htmlContent,
        tags: ['Jail', 'Booking', 'Community Activities'],
        authors: ['YOUR_AUTHOR_ID'],
        status: 'published', // or 'draft' for review
        featured: false,
        meta_title: `Angelina County Jail Activity - ${getDayOfWeek(date)}`,
        meta_description: `Daily jail booking activity for Angelina County. Booking data provided by courtesy of the Angelina County Sheriff's Department.`,
        og_title: `Angelina County Jail Activity - ${getDayOfWeek(date)}`,
        og_description: `Daily jail booking activity for Angelina County.`,
        published_at: new Date().toISOString()
    };
    
    try {
        const result = await api.posts.add(post);
        console.log('Post published successfully:', result.url);
        return result;
    } catch (error) {
        console.error('Error publishing post:', error);
        throw error;
    }
}

// Function to generate HTML content for Ghost
function generateJailActivityHTML(arrestData, date) {
    let html = `
        <div class="jail-activity-article">
            <p><em>Booking activity data, details and images provided by courtesy of the Angelina County Sheriff's Department.</em></p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #007acc; padding: 15px 20px; margin: 20px 0; border-radius: 4px;">
                <p><strong><em>All person(s) listed below are considered innocent until proven guilty in a court of law.</em></strong></p>
            </div>
    `;
    
    // Add each arrestee record
    arrestData.forEach(arrestee => {
        html += generateArresteeHTML(arrestee);
    });
    
    html += `
            <hr>
            <p><em>Published by Staff Reporter</em></p>
        </div>
    `;
    
    return html;
}

// Function to generate individual arrestee HTML
function generateArresteeHTML(arrestee) {
    const chargesList = arrestee.charges.map(charge => 
        `<li>${charge.description} (Bond: $${charge.bond})</li>`
    ).join('');
    
    return `
        <div style="display: flex; gap: 20px; margin: 30px 0; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; background-color: #fafafa;">
            <div style="flex-shrink: 0; width: 150px;">
                ${arrestee.mugshot ? 
                    `<img src="${arrestee.mugshot}" alt="Mugshot" style="width: 100%; border-radius: 6px; border: 2px solid #ddd;">` :
                    `<div style="width: 100%; height: 150px; background-color: #f0f0f0; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #666;">No Image</div>`
                }
            </div>
            <div style="flex: 1;">
                <p><strong>Name:</strong> ${arrestee.name}</p>
                <p><strong>Age:</strong> ${arrestee.age}</p>
                <p><strong>City:</strong> ${arrestee.city}</p>
                <p><strong>State:</strong> ${arrestee.state}</p>
                <p><strong>Height:</strong> ${arrestee.height}</p>
                <p><strong>Weight:</strong> ${arrestee.weight}</p>
                <p><strong>Booked:</strong> ${formatBookingDate(arrestee.booked)}</p>
                <p><strong>Released:</strong> ${arrestee.released || 'Still in custody'}</p>
                <div style="margin-top: 15px;">
                    <p><strong>Charges:</strong></p>
                    <ul style="margin: 8px 0; padding-left: 20px;">
                        ${chargesList}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function getDayOfWeek(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(date).getDay()];
}

function formatBookingDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US') + ' - ' + date.toLocaleTimeString('en-US', {hour12: false});
}

module.exports = { publishJailActivity, generateJailActivityHTML };