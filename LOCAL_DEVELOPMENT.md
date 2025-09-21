# 🚀 Local Development Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
# In the project directory
npm install
```

### 2. Start Development Server
```bash
npm run serve
```

### 3. Open Your Browser
Go to: http://localhost:3000

That's it! You now have a complete local development environment.

## 📋 What You Get

### Local Development Server
- **Main Dashboard**: http://localhost:3000
- **Article Preview**: http://localhost:3000/preview  
- **Social Sharing Test**: http://localhost:3000/test-social-sharing.html
- **Mock Data API**: http://localhost:3000/api/booking-data

### Test Scenarios
- **Default Records**: 5 sample arrestees with various data
- **No Arrests**: Empty day scenario
- **Single Arrest**: One record only
- **No Mugshots**: All records without photos
- **All Released**: Everyone has been released

## 🧪 Testing Your Changes

### Run Article Generation Tests
```bash
# Test all scenarios and save HTML files
npm run test:local

# Check output in the /output directory
```

### Preview Live Changes
```bash
# Start development server with auto-reload
npm run dev

# Visit http://localhost:3000/preview
# Change scenario/date in the controls
```

### Test Social Sharing
```bash
# Visit the social sharing test page
# Click share buttons to see alert messages
# Test URL fragment navigation (#record-id)
```

## 📁 Key Development Files

### Mock Data (`/data/mock-data.js`)
Sample arrest records with realistic data:
- 5 default arrestees
- Various scenarios (no arrests, single arrest, etc.)
- Sample advertisement data
- Different release statuses

### Local Server (`/scripts/local-server.js`)
Express.js server providing:
- Live article preview
- Mock API endpoints
- Static file serving
- Development dashboard

### Test Scripts (`/scripts/test-local.js`)
Generates test HTML files:
- Different scenarios
- Complete standalone HTML
- Social sharing functionality
- Saves to `/output` directory

## 🔧 Development Workflow

### 1. Make Changes
Edit any of these files and see changes immediately:
- `/templates/jail-activity.html` - Base template
- `/assets/css/jail-activity.css` - Styling
- `/assets/js/jail-activity.js` - JavaScript functionality
- `/scripts/generate-article.js` - Generation logic

### 2. Test Changes
```bash
# Method 1: Live preview (recommended)
npm run serve
# Visit http://localhost:3000/preview

# Method 2: Generate test files
npm run test:local
# Check /output directory for HTML files
```

### 3. Test Different Scenarios
Use the preview controls to test:
- Different numbers of arrests
- Missing data (no mugshots, no addresses)
- Various release statuses
- Advertisement integration

### 4. Test Social Sharing
- Click share buttons in preview
- Test URL fragments (#record-id)
- Verify social media content generation
- Test mobile responsiveness

## 🎨 Customization Tips

### Change Styling
Edit `/assets/css/jail-activity.css`:
```css
/* Example: Change highlight color */
.arrestee-record.shared-record {
    border-color: #your-color !important;
}

/* Example: Modify share button colors */
.facebook-share {
    background: #your-facebook-color;
}
```

### Modify Share Messages
Edit `/assets/js/jail-activity.js`:
```javascript
function createShareText(recordData) {
    // Customize the share message format
    return `Your custom format: ${recordData.name}...`;
}
```

### Add New Test Scenarios
Edit `/data/mock-data.js`:
```javascript
const mockScenarios = {
    // Add your custom scenario
    yourScenario: [
        // Your test data
    ]
};
```

## 🔍 Debugging

### Enable Debug Mode
In `.env`:
```
DEBUG_MODE=true
```

### Check Console Logs
- Browser console shows JavaScript activity
- Server console shows API requests
- Look for error messages and warnings

### Common Issues
1. **Port already in use**: Change `LOCAL_PORT` in `.env`
2. **Missing dependencies**: Run `npm install`
3. **Changes not showing**: Hard refresh browser (Ctrl+F5)

## 📊 Test Data Structure

### Sample Arrestee Record
```javascript
{
    id: "rec1234567890",
    name: "Smith, John Michael",
    age: 32,
    city: "Lufkin",
    state: "TX",
    height: "5'10\"",
    weight: "175 lbs",
    bookingDate: new Date("2023-12-19T14:30:00"),
    releaseDate: null, // or Date object if released
    mugshot: "https://example.com/mugshot.jpg", // or null
    charges: [
        {
            description: "Driving While Intoxicated",
            bond: 2500.0
        }
    ]
}
```

### Sample Advertisement
```javascript
{
    id: "recAD12345678",
    title: "Local Business Advertisement",
    imageUrl: "https://example.com/ad.jpg",
    linkUrl: "https://business-website.com",
    altText: "Visit our local business!",
    advertiser: "Sample Local Business"
}
```

## 🚀 Production Preparation

### When You're Ready for Production:

1. **Get Real API Keys**:
   - Airtable Personal Access Token
   - Ghost Admin API Key

2. **Update Environment**:
   ```bash
   # Edit .env with real values
   AIRTABLE_API_KEY=your_real_key
   GHOST_ADMIN_API_KEY=your_real_key
   USE_MOCK_DATA=false
   SKIP_GHOST_PUBLISH=false
   ```

3. **Test Production Mode**:
   ```bash
   npm run generate
   # This will use real APIs but skip publishing
   ```

4. **Deploy to GitHub**:
   - Push to your repository
   - Set up GitHub Actions with secrets
   - Enable daily automation

## 💡 Pro Tips

### Rapid Development
- Keep the dev server running (`npm run serve`)
- Use the preview page for quick testing
- Test social sharing with the dedicated test page

### Content Testing
- Test with different numbers of records
- Verify mobile responsiveness
- Check social sharing content generation

### Performance Testing
- Test with many records scenario
- Verify image loading fallbacks
- Test with slow internet connection

### Design Testing
- Test without mugshots
- Test with long names/charges
- Test various screen sizes

---

🎉 **Happy Developing!** Your local environment is set up and ready for testing the jail activity article generator.