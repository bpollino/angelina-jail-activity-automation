# Advertisement Management System - Airtable Schema

## Overview
Complete backend system for managing jail activity advertisements with Airtable integration and self-service advertiser portal.

## Airtable Base Structure

### Primary Table: "Advertisements"

#### Required Fields:

1. **Title** (Single line text)
   - Purpose: Internal reference name for the advertisement
   - Example: "Smith Law Firm - October 2025"
   - Required: Yes

2. **Advertiser Name** (Single line text)
   - Purpose: Business or individual name
   - Example: "Smith Law Firm"
   - Required: Yes

3. **Email** (Email field)
   - Purpose: Contact email for advertiser
   - Example: "info@smithlawfirm.com"
   - Required: Yes

4. **Phone** (Phone number field)
   - Purpose: Contact phone number
   - Example: "(903) 555-0123"
   - Required: No

5. **Business Website** (URL field)
   - Purpose: Advertiser's main website
   - Example: "https://www.smithlawfirm.com"
   - Required: No

6. **Ad Image** (Attachment field)
   - Purpose: Advertisement image file (accepts any ratio)
   - Accepts: JPG, PNG, WebP files
   - Required: Yes

7. **Target URL** (URL field)
   - Purpose: Where users go when they click the ad
   - Example: "https://www.smithlawfirm.com/criminal-defense"
   - Required: Yes

8. **Ad Description** (Long text)
   - Purpose: Brief description of the advertisement
   - Example: "Criminal defense attorney serving East Texas"
   - Required: Yes

9. **Status** (Single select)
   - Options: "Pending Review", "Approved", "Active", "Rejected", "Expired"
   - Purpose: Track advertisement approval and lifecycle
   - Default: "Pending Review"

10. **Start Date** (Date field)
    - Purpose: Campaign start date
    - Required: Yes

11. **End Date** (Date field)
    - Purpose: Campaign end date
    - Required: Yes

12. **Priority** (Number field)
    - Purpose: Control ad order if multiple are active
    - Range: 1-100 (higher numbers = higher priority)
    - Default: 50

13. **Submission Date** (Date field)
    - Purpose: When the ad was submitted
    - Auto-set on creation

14. **Admin Notes** (Long text)
    - Purpose: Internal notes for approval/rejection reasons
    - Required: No

15. **Daily Budget** (Currency field)
    - Purpose: How much advertiser wants to spend per day
    - Required: No

16. **Total Budget** (Currency field)
    - Purpose: Total campaign budget
    - Required: No

17. **Click Count** (Number field)
    - Purpose: Track advertisement performance
    - Default: 0

#### Views to Create:

1. **"Pending Review"**
   - Filter: Status = "Pending Review"
   - Sort: Submission Date (oldest first)
   - Purpose: Admin review queue

2. **"Active Ads"**
   - Filter: Status = "Active" AND Start Date ≤ TODAY() AND End Date ≥ TODAY()
   - Sort: Priority (descending), Start Date (ascending)
   - Purpose: Currently running advertisements

3. **"Approved Waiting"**
   - Filter: Status = "Approved" AND Start Date > TODAY()
   - Sort: Start Date (ascending)
   - Purpose: Future campaigns ready to go

4. **"All Submissions"**
   - Filter: None
   - Sort: Submission Date (newest first)
   - Purpose: Complete submission history

## Airtable Setup Instructions

### Step 1: Create Base
1. Go to airtable.com and create new base
2. Name it "Jail Activity Advertisements"
3. Delete default tables

### Step 2: Create Advertisement Table
1. Create table named "Advertisements"
2. Add all fields listed above with correct types
3. Set up single select options for Status field
4. Configure views as specified

### Step 3: API Configuration
1. Go to airtable.com/api and select your base
2. Note your Base ID (starts with "app")
3. Create API key with read/write permissions
4. Add base ID and API key to your .env file

### Step 4: Permissions Setup
1. Set table permissions for form submissions
2. Configure webhook endpoints (if using real-time updates)
3. Test API access with your existing credentials

## Integration Points

### With Existing System
- Update `generate-article.js` to fetch from "Active Ads" view
- Replace static ad data with Airtable query
- Handle multiple active ads with priority system

### Self-Service Portal
- HTML form connects directly to Airtable API
- File upload handling for images
- Email notifications for submission confirmation
- Admin notification for new submissions

### Admin Dashboard
- Review pending submissions
- Approve/reject with notes
- Manage active campaigns
- View performance metrics

## Security Considerations

### API Key Management
- Use environment variables for sensitive data
- Separate read/write permissions where possible
- Regular key rotation

### File Upload Security
- Validate file types and sizes
- Scan for malicious content
- Implement rate limiting

### Data Validation
- Email format validation
- URL validation for target links
- Image dimension and file size checks
- Required field enforcement

This schema provides a complete foundation for advertisement management with proper workflow, tracking, and integration capabilities.