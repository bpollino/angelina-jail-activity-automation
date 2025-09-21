# Advertisement Specifications for Angelina County Jail Activity Articles

## Overview
This document outlines the technical specifications and standards for advertisements displayed in our daily jail activity articles on angelina411.com.

## Advertisement Placement
- **Location**: Prominently placed after the legal disclaimer and before the first arrestee record
- **Frequency**: One advertisement per daily article
- **Visibility**: High visibility placement ensuring maximum reader engagement

## Technical Specifications

### Image Requirements

#### **Dimensions & Sizing**
- **Desktop Recommended**: 
  - **Primary**: 600x150px (Custom Banner - matches article containers)
  - **Alternative**: 728x90px (Leaderboard) or 468x150px (Banner)
- **Mobile Optimized**: Must be responsive and readable at smaller sizes
- **Maximum Width**: 800px (will scale down automatically)
- **Maximum Height**: 200px on desktop, 120px on mobile
- **Aspect Ratios**: 
  - Horizontal: 4:1 or 3:1 (recommended for new taller format)
  - Rectangle: 3:1 to 5:2 (ideal)
  - Avoid: Square or vertical formats (poor mobile experience)

#### **File Specifications**
- **Format**: JPG, PNG, or WebP
- **File Size**: Maximum 2MB (smaller files load faster)
- **Resolution**: 72-150 DPI (web optimized)
- **Color Space**: RGB (not CMYK)

#### **Quality Standards**
- **Image Quality**: High resolution, crisp and clear
- **Text Legibility**: All text must be readable at mobile sizes
- **Professional Appearance**: Clean, professional design that reflects well on both brands

### Content Guidelines

#### **Required Elements**
- **Business Name**: Clearly visible and readable
- **Contact Information**: Phone number, website, or address
- **Call-to-Action**: Clear directive (e.g., "Call Now", "Visit Today", "Learn More")

#### **Prohibited Content**
- No competing news/media services
- No inappropriate or offensive content
- No misleading claims or false information
- No excessive animation or flashing elements

### Technical Setup in Airtable

#### **Required Fields in Advertisement Table**
Create an "Advertisements" table in your Airtable base with these fields:

1. **Title** (Single line text)
   - Purpose: Internal reference name
   - Example: "Smith Law Firm - September 2025"

2. **Image** (Attachment)
   - Purpose: Advertisement image file
   - Accepts: JPG, PNG, WebP files

3. **Link URL** (URL field)
   - Purpose: Where users go when they click the ad
   - Example: "https://www.smithlawfirm.com"

4. **Alt Text** (Single line text)
   - Purpose: Accessibility and SEO
   - Example: "Smith Law Firm - Criminal Defense Attorney"

5. **Active** (Checkbox)
   - Purpose: Control which ad is currently displayed
   - Note: Only one ad should be active at a time

6. **Priority** (Number)
   - Purpose: Control ad order if multiple are active
   - Higher numbers = higher priority

7. **Start Date** (Date field) - Optional
   - Purpose: Campaign start date

8. **End Date** (Date field) - Optional
   - Purpose: Campaign end date

## Sponsor Submission Process

### **Step 1: Design Creation**
Sponsors should provide:
- High-quality advertisement image meeting specifications above
- Destination URL for click-through
- Alt text description for accessibility

### **Step 2: File Delivery**
**Preferred Methods:**
- Email attachment (if under 10MB)
- Google Drive/Dropbox link
- Direct upload to provided portal

**File Naming Convention:**
`BusinessName_AdType_MMYYYY.jpg`
Example: `SmithLaw_Banner_092025.jpg`

### **Step 3: Airtable Management**
- Upload image to Airtable "Advertisements" table
- Set appropriate link URL and alt text
- Activate advertisement by checking "Active" field
- Deactivate previous advertisement

## Performance & Analytics

### **Tracking Capabilities**
- Click-through tracking via Google Analytics
- Impression counting (daily article views)
- Performance reporting available monthly

### **Optimization Recommendations**
- Test different ad designs and messaging
- Monitor click-through rates and adjust accordingly
- Seasonal messaging can improve engagement

### **Responsive Design Behavior**

### **Desktop Display**
- **Height**: Approximately 200px tall (matches arrestee record containers)
- **Full-size advertisement display with hover effects**
- **Centered within container with proper padding**
- **Click tracking enabled**

### **Mobile Display (768px and below)**
- **Height**: Reduced to 150px for better mobile experience
- **Automatic scaling to fit screen width**
- **Touch-optimized click areas**
- **Centered layout with proper spacing**

### **Small Mobile (480px and below)**
- **Height**: Further reduced to 120px
- **Optimized for portrait phone viewing**
- **Maintained aspect ratio and legibility**
- **Touch-friendly interaction area**

### **Print Version**
- Advertisement appears in print-friendly format
- Grayscale conversion if needed
- Contact information remains visible

## Quality Assurance

### **Pre-Publication Review**
- Image quality verification
- Link functionality testing
- Mobile responsiveness check
- Brand compliance review

### **Ongoing Monitoring**
- Daily verification of ad display
- Link functionality monitoring
- Performance tracking and reporting

## Support & Maintenance

### **Contact Information**
- Technical Issues: [Your technical contact]
- Account Management: [Your account manager]
- Emergency Changes: [Emergency contact]

### **Service Level Agreement**
- Ad changes processed within 24 hours
- Technical issues resolved within 4 hours
- Monthly performance reports provided

## Pricing & Terms
- Advertisement specifications must be met for publication
- Changes to active advertisements incur additional fees
- Performance guarantees based on website traffic
- Contract terms specify duration and renewal options

---

**Last Updated**: September 19, 2025  
**Document Version**: 1.0  
**Contact**: advertising@angelina411.com