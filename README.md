# Angelina County Jail Activity Article Generator

## Project Overview
Automated system that generates daily HTML articles from jail booking data for angelina411.com. Data is scraped hourly from county jail records and stored in Airtable, then processed into formatted news articles similar to salina311.com's jail activity posts.

### Key Features
- **Automated Daily Publishing**: GitHub Actions workflow runs at 6 AM Central Time
- **Responsive Design**: Mobile-first approach with professional styling
- **Individual Record Sharing**: Share specific arrestee records on social media
- **Advertisement Integration**: Automated ad placement from Airtable
- **Lightbox Image Viewing**: Professional mugshot display
- **Ghost.io Integration**: Seamless publishing to WordPress alternative CMS

## Project Structure

```
Ghost HTML - Jail Post Design/
├── .github/
│   ├── workflows/
│   │   └── daily-article.yml         # GitHub Actions workflow
│   └── copilot-instructions.md       # AI agent guidance
├── scripts/
│   └── generate-article.js           # Main automation script
├── templates/
│   └── jail-activity.html            # HTML template (for reference)
├── assets/
│   ├── css/
│   │   └── jail-activity.css         # Styling
│   ├── js/
│   │   └── jail-activity.js          # JavaScript functionality
│   └── images/
├── ghost-publisher.js                # Ghost API integration
├── ghost-theme-styles.css            # Ghost theme CSS
├── ghost-theme-template.hbs          # Ghost Handlebars template
├── test-social-sharing.html          # Demo of social sharing functionality
├── package.json                      # Node.js dependencies
├── .env.example                      # Environment configuration template
└── README.md
```

## Social Sharing Features

### Individual Record Sharing
Each arrestee record includes social media sharing buttons:
- **Facebook**: Share with custom message and direct link to record
- **Twitter**: Tweet with 240-character limit and record link
- **Copy Link**: Copy direct link to specific record for easy sharing

### Share Content Format
```
Angelina County Jail Activity: [Name], age [Age] from [City, State] - [Primary Charge]. Booked [Date/Time]
```

### Technical Implementation
- Uses platform-specific sharing APIs (Facebook Sharer, Twitter Intent)
- Generates unique record IDs for direct linking (`#record-123456-0`)
- Clipboard API with fallback for older browsers
- Visual feedback for successful copy operations

## GitHub Actions Automation

### Workflow Schedule
- **Runs Daily**: 6:00 AM Central Time (automatically adjusts for CST/CDT)
- **Manual Trigger**: Can be run manually with custom date
- **Fully Automated**: Fetches data → Generates article → Publishes to Ghost

### Setup Instructions

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/angelina-county-jail-activity.git
   cd angelina-county-jail-activity
   ```

2. **Configure GitHub Secrets**
   Go to your GitHub repository → Settings → Secrets and variables → Actions
   
   Add these repository secrets:
   ```
   AIRTABLE_API_KEY=your_airtable_api_key
   AIRTABLE_BASE_ID=appBn4Xs7GdnheynS
   AIRTABLE_TABLE_NAME=Jail Records
   GHOST_ADMIN_API_KEY=your_ghost_admin_api_key
   GHOST_SITE_URL=https://www.angelina411.com
   ```

3. **Enable GitHub Actions**
   - Go to repository → Actions tab
   - Enable workflows if prompted
   - The daily workflow will start running automatically

### Manual Execution
Run the workflow manually with a specific date:
1. Go to Actions → "Generate Jail Activity Article"
2. Click "Run workflow"
3. Enter date in YYYY-MM-DD format (optional)

## API Configuration

### Airtable Setup
1. Get API key from: https://airtable.com/developers/web/api/introduction
2. Base ID: `appBn4Xs7GdnheynS` (from your provided URL)
3. Table should include fields: Name, Age, City, State, Height, Weight, Booking Date, Release Date, Charges, Mugshot

### Ghost Setup
1. Go to Ghost Admin → Settings → Integrations
2. Add Custom Integration named "Jail Activity Generator"
3. Copy the Admin API Key
4. Add to GitHub Secrets

## Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create Environment File**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Test Locally**
   ```bash
   npm start
   # or for specific date:
   ARTICLE_DATE=2025-09-19 npm start
   ```

## Data Structure Expected

Each Airtable record should include:
- **Personal Info**: Name (Last,First Middle), Age, City, State, Height, Weight
- **Booking Info**: Booking Date/Time, Release Date (optional)
- **Charges**: Charges with bond amounts
- **Mugshot**: Image attachment (optional)

## Features

- **Fully Automated**: No manual intervention required
- **Error Handling**: Graceful handling of missing data and API failures
- **Responsive Design**: Mobile-friendly article layout
- **SEO Optimized**: Proper meta tags and Ghost integration
- **Professional Styling**: Matches salina311.com reference format

## Monitoring

- **GitHub Actions Logs**: View execution logs in Actions tab
- **Error Notifications**: Failed workflows will show in GitHub
- **Published Articles**: Check angelina411.com for published content

## Troubleshooting

### Common Issues:
1. **No articles generated**: Check if there's booking data for the target date
2. **API errors**: Verify all secrets are correctly set in GitHub
3. **Formatting issues**: Check Ghost theme CSS integration

### Logs Location:
- GitHub Actions: Repository → Actions → Workflow run
- Local development: Console output from `npm start`