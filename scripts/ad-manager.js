const axios = require('axios');

/**
 * Fetch active advertisement from Airtable
 */
async function fetchActiveAdvertisement() {
    try {
        const AIRTABLE_API_KEY = process.env.AIRTABLE_AD_API_KEY || process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_AD_BASE_ID || process.env.AIRTABLE_BASE_ID;
        
        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
            console.log('⚠️  No Airtable credentials found for advertisements - using fallback');
            return null;
        }

        // Query the "Active Ads" view to get currently running advertisements
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const response = await axios.get(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Advertisements`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    view: 'Active Ads', // Use the Active Ads view we defined in schema
                    maxRecords: 1, // Only get the highest priority active ad
                    sort: [
                        { field: 'Priority', direction: 'desc' },
                        { field: 'Start Date', direction: 'asc' }
                    ],
                    filterByFormula: `AND(
                        {Status} = 'Active',
                        {Start Date} <= '${today}',
                        {End Date} >= '${today}'
                    )`
                }
            }
        );

        if (response.data.records.length === 0) {
            console.log('📭 No active advertisements found');
            return null;
        }

        const adRecord = response.data.records[0];
        const fields = adRecord.fields;
        
        // Extract image URL from Airtable attachment field
        let imageUrl = null;
        if (fields['Ad Image'] && fields['Ad Image'].length > 0) {
            imageUrl = fields['Ad Image'][0].url;
        }

        // Construct advertisement data object
        const adData = {
            id: adRecord.id,
            title: fields['Title'] || 'Advertisement',
            description: fields['Ad Description'] || 'Local Business Advertisement',
            link: fields['Target URL'] || 'https://example.com',
            imageUrl: imageUrl,
            advertiserName: fields['Advertiser Name'] || 'Local Business',
            startDate: fields['Start Date'],
            endDate: fields['End Date'],
            priority: fields['Priority'] || 50
        };

        console.log(`📢 Active advertisement loaded: ${adData.title}`);
        console.log(`   Advertiser: ${adData.advertiserName}`);
        console.log(`   Campaign: ${adData.startDate} to ${adData.endDate}`);
        console.log(`   Image: ${imageUrl ? 'Yes' : 'No image provided'}`);

        // Increment click count (optional - for basic analytics)
        await incrementAdViews(adRecord.id);

        return adData;

    } catch (error) {
        console.error('❌ Error fetching advertisement from Airtable:', error.message);
        
        // Return fallback advertisement if API fails
        return {
            title: 'Advertise with Angelina411',
            description: 'Reach thousands of local readers daily. Contact us to advertise in our jail activity articles.',
            link: 'mailto:advertising@angelina411.com',
            imageUrl: null,
            advertiserName: 'Angelina411 News',
            isFallback: true
        };
    }
}

/**
 * Increment advertisement view count for basic analytics
 */
async function incrementAdViews(recordId) {
    try {
        const AIRTABLE_API_KEY = process.env.AIRTABLE_AD_API_KEY || process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_AD_BASE_ID || process.env.AIRTABLE_BASE_ID;

        // Get current click count
        const getResponse = await axios.get(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Advertisements/${recordId}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );

        const currentViews = getResponse.data.fields['Click Count'] || 0;

        // Update with incremented count
        await axios.patch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Advertisements/${recordId}`,
            {
                fields: {
                    'Click Count': currentViews + 1
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

    } catch (error) {
        // Don't fail the whole process if analytics update fails
        console.log('⚠️  Could not update advertisement view count:', error.message);
    }
}

/**
 * Get advertisement submission stats for admin dashboard
 */
async function getAdvertisementStats() {
    try {
        const AIRTABLE_API_KEY = process.env.AIRTABLE_AD_API_KEY || process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_AD_BASE_ID || process.env.AIRTABLE_BASE_ID;

        const response = await axios.get(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Advertisements`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );

        const records = response.data.records;
        const stats = {
            total: records.length,
            pending: records.filter(r => r.fields.Status === 'Pending Review').length,
            active: records.filter(r => r.fields.Status === 'Active').length,
            approved: records.filter(r => r.fields.Status === 'Approved').length,
            rejected: records.filter(r => r.fields.Status === 'Rejected').length
        };

        return stats;

    } catch (error) {
        console.error('❌ Error fetching advertisement stats:', error.message);
        return { error: error.message };
    }
}

module.exports = {
    fetchActiveAdvertisement,
    incrementAdViews,
    getAdvertisementStats
};