const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

/**
 * Submit advertisement to Airtable
 */
router.post('/submit-advertisement', upload.single('adImage'), async (req, res) => {
    try {
        console.log('📝 Processing advertisement submission...');
        
        // Validate required fields
        const requiredFields = ['businessName', 'contactEmail', 'targetUrl', 'adDescription', 'startDate', 'endDate'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ 
                    error: `Missing required field: ${field}` 
                });
            }
        }

        // Validate file upload
        if (!req.file) {
            return res.status(400).json({ 
                error: 'Advertisement image is required' 
            });
        }

        // Validate dates
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
            return res.status(400).json({ 
                error: 'Start date cannot be in the past' 
            });
        }

        if (endDate <= startDate) {
            return res.status(400).json({ 
                error: 'End date must be after start date' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.contactEmail)) {
            return res.status(400).json({ 
                error: 'Invalid email address format' 
            });
        }

        // Validate URL format
        try {
            new URL(req.body.targetUrl);
        } catch (error) {
            return res.status(400).json({ 
                error: 'Invalid target URL format' 
            });
        }

        console.log(`📧 Processing submission from: ${req.body.businessName}`);
        console.log(`📁 Image file: ${req.file.originalname} (${req.file.size} bytes)`);

        // Upload to Airtable
        const airtableRecord = await submitToAirtable(req.body, req.file);
        
        console.log(`✅ Successfully submitted to Airtable: ${airtableRecord.id}`);

        // Send confirmation email (optional - implement if needed)
        // await sendConfirmationEmail(req.body.contactEmail, req.body.businessName);

        res.json({
            success: true,
            message: 'Advertisement submitted successfully',
            recordId: airtableRecord.id,
            status: 'pending-review'
        });

    } catch (error) {
        console.error('❌ Error processing advertisement submission:', error);
        
        // Return appropriate error message
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                error: 'File size too large. Maximum size is 5MB.' 
            });
        }

        if (error.message === 'Only image files are allowed') {
            return res.status(400).json({ 
                error: 'Only image files (JPG, PNG, WebP) are allowed.' 
            });
        }

        if (error.response && error.response.data) {
            // Airtable API error
            return res.status(500).json({ 
                error: 'Failed to submit to database. Please try again.' 
            });
        }

        res.status(500).json({ 
            error: 'Internal server error. Please try again later.' 
        });
    }
});

/**
 * Submit form data and image to Airtable
 */
async function submitToAirtable(formData, imageFile) {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_AD_API_KEY || process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_AD_BASE_ID || process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
        throw new Error('Airtable configuration missing');
    }

    try {
        // First, create the record without the attachment
        const recordData = {
            fields: {
                'Title': `${formData.businessName} - ${new Date().toLocaleDateString()}`,
                'Advertiser Name': formData.businessName,
                'Email': formData.contactEmail,
                'Phone': formData.contactPhone || '',
                'Business Website': formData.businessWebsite || '',
                'Target URL': formData.targetUrl,
                'Ad Description': formData.adDescription,
                'Status': 'Pending Review',
                'Start Date': formData.startDate,
                'End Date': formData.endDate,
                'Submission Date': new Date().toISOString().split('T')[0],
                'Daily Budget': formData.dailyBudget || '',
                'Priority': 50, // Default priority
                'Click Count': 0,
                'Admin Notes': formData.additionalNotes || ''
            }
        };

        console.log('📤 Creating Airtable record...');
        const createResponse = await axios.post(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Advertisements`,
            recordData,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const recordId = createResponse.data.id;
        console.log(`✅ Record created: ${recordId}`);

        // Now upload the image as an attachment
        console.log('📎 Uploading image attachment...');
        await uploadImageToAirtable(recordId, imageFile);

        return createResponse.data;

    } catch (error) {
        console.error('Airtable submission error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Upload image file to Airtable record
 */
async function uploadImageToAirtable(recordId, imageFile) {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_AD_API_KEY || process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_AD_BASE_ID || process.env.AIRTABLE_BASE_ID;

    try {
        // Create form data for file upload
        const formData = new FormData();
        formData.append('fields[Ad Image][0][url]', 'data:' + imageFile.mimetype + ';base64,' + imageFile.buffer.toString('base64'));
        formData.append('fields[Ad Image][0][filename]', imageFile.originalname);

        // Alternative approach: Upload to temporary file storage first, then reference URL
        // For now, we'll use base64 encoding which works but has size limitations
        
        const updateData = {
            fields: {
                'Ad Image': [
                    {
                        url: `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`,
                        filename: imageFile.originalname
                    }
                ]
            }
        };

        const updateResponse = await axios.patch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Advertisements/${recordId}`,
            updateData,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Image uploaded successfully');
        return updateResponse.data;

    } catch (error) {
        console.error('Image upload error:', error.response?.data || error.message);
        
        // If image upload fails, at least we have the text data
        // Could implement retry logic or external file hosting here
        console.log('⚠️  Image upload failed, but record was created successfully');
        throw error;
    }
}

/**
 * Get advertisement statistics for admin dashboard
 */
router.get('/advertisement-stats', async (req, res) => {
    try {
        const { getAdvertisementStats } = require('./ad-manager');
        const stats = await getAdvertisementStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

/**
 * Get pending advertisements for admin review
 */
router.get('/pending-advertisements', async (req, res) => {
    try {
        const AIRTABLE_API_KEY = process.env.AIRTABLE_AD_API_KEY || process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_AD_BASE_ID || process.env.AIRTABLE_BASE_ID;

        const response = await axios.get(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Advertisements`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                },
                params: {
                    view: 'Pending Review',
                    sort: [{ field: 'Submission Date', direction: 'asc' }]
                }
            }
        );

        const pendingAds = response.data.records.map(record => ({
            id: record.id,
            title: record.fields.Title,
            advertiserName: record.fields['Advertiser Name'],
            email: record.fields.Email,
            submissionDate: record.fields['Submission Date'],
            startDate: record.fields['Start Date'],
            endDate: record.fields['End Date'],
            description: record.fields['Ad Description'],
            targetUrl: record.fields['Target URL'],
            imageUrl: record.fields['Ad Image'] ? record.fields['Ad Image'][0]?.url : null,
            dailyBudget: record.fields['Daily Budget'],
            notes: record.fields['Admin Notes']
        }));

        res.json({ advertisements: pendingAds });

    } catch (error) {
        console.error('Error fetching pending advertisements:', error);
        res.status(500).json({ error: 'Failed to fetch pending advertisements' });
    }
});

/**
 * Approve or reject advertisement
 */
router.post('/review-advertisement/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        const { action, notes } = req.body; // action: 'approve' or 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject"' });
        }

        const AIRTABLE_API_KEY = process.env.AIRTABLE_AD_API_KEY || process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_AD_BASE_ID || process.env.AIRTABLE_BASE_ID;

        const status = action === 'approve' ? 'Approved' : 'Rejected';
        
        const updateData = {
            fields: {
                'Status': status,
                'Admin Notes': notes || ''
            }
        };

        const response = await axios.patch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Advertisements/${recordId}`,
            updateData,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({ 
            success: true, 
            status: status,
            recordId: recordId 
        });

    } catch (error) {
        console.error('Error reviewing advertisement:', error);
        res.status(500).json({ error: 'Failed to update advertisement status' });
    }
});

module.exports = router;