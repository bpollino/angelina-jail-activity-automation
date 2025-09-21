# GitHub Deployment Guide

## Automated Daily Jail Activity Posts

This guide will help you deploy the jail activity post system to GitHub with automated daily publishing at 7AM Central Time.

## 🚀 Quick Setup

### 1. Push to GitHub Repository

1. Create a new GitHub repository or use an existing one
2. Push all files from this project to your repository:

```bash
git init
git add .
git commit -m "Initial commit: Jail activity post automation"
git remote add origin https://github.com/your-username/your-repo-name.git
git push -u origin main
```

### 2. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and Variables → Actions, and add these secrets:

#### Required Secrets:
- **`AIRTABLE_API_KEY`**: Your Airtable Personal Access Token
- **`GHOST_ADMIN_API_KEY`**: Your Ghost.io Admin API Key

#### Optional Secrets (with defaults):
- **`AIRTABLE_BASE_ID`**: Your Airtable Base ID (defaults to `appBn4Xs7GdnheynS`)
- **`AIRTABLE_TABLE_NAME`**: Table name (defaults to `Angelina County Jail Activity`)  
- **`GHOST_API_URL`**: Ghost site URL (defaults to `https://angelina-411.ghost.io`)

### 3. Enable GitHub Actions

1. Go to your repository → Actions tab
2. Enable GitHub Actions if prompted
3. The workflow will automatically run daily at 7AM Central Time

## 📋 How It Works

### Daily Schedule
- **Runs at**: 7:00 AM Central Time (12:00 PM UTC)
- **Frequency**: Every day
- **Data Source**: Yesterday's bookings from Airtable
- **Output**: Published post on Ghost.io

### Workflow Steps
1. **Checkout**: Downloads repository code
2. **Setup Node.js**: Installs Node.js 18 environment
3. **Install Dependencies**: Runs `npm install`
4. **Create Post**: Executes `npm run deploy`
5. **Log Results**: Shows success/failure status

## 🔧 API Keys Setup

### Airtable Personal Access Token
1. Go to [Airtable Account](https://airtable.com/account)
2. Click "Generate token" in the Personal access tokens section
3. Add scopes: `data.records:read` for your base
4. Add the base you want to access
5. Copy the token and add to GitHub Secrets as `AIRTABLE_API_KEY`

### Ghost Admin API Key
1. Go to your Ghost Admin panel → Settings → Integrations
2. Click "Add custom integration"
3. Name it "Daily Jail Posts" or similar
4. Copy the Admin API Key
5. Add to GitHub Secrets as `GHOST_ADMIN_API_KEY`

## 📅 Manual Trigger

You can manually trigger the workflow:

1. Go to your repository → Actions
2. Click "Daily Jail Activity Post" workflow
3. Click "Run workflow" button
4. Select branch and click "Run workflow"

## 🔍 Monitoring

### Check Workflow Status
1. Go to repository → Actions
2. View recent runs and their status
3. Click on any run to see detailed logs

### Logs Include:
- ✅ Configuration validation
- 📊 Records found count
- 📝 Post creation status  
- 🔗 Published post URL
- ❌ Error details (if any)

## ⚠️ Troubleshooting

### Common Issues

#### "No records found"
- Normal for weekends/holidays
- Check Airtable data for target date
- Verify date filtering logic

#### "API Key Invalid"
- Check GitHub Secrets are set correctly
- Verify API keys haven't expired
- Ensure proper permissions/scopes

#### "Post Creation Failed"
- Check Ghost.io admin API permissions
- Verify Ghost site URL is correct
- Check Ghost.io service status

### Debug Mode
To debug locally before deploying:

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your API keys to .env file
# Then test the deployment script
npm run deploy
```

## 🔒 Security Notes

- **Never commit `.env` files** with real API keys
- **Use GitHub Secrets** for all sensitive information
- **API keys should be read-only** when possible
- **Monitor repository access** to prevent unauthorized use

## 📊 System Architecture

```
GitHub Actions (7AM Daily)
    ↓
Deploy Script (Node.js)
    ↓
Airtable API (Fetch Records)
    ↓
Content Generation (Lexical Format)
    ↓
Ghost.io API (Publish Post)
    ↓
Published Article (angelina-411.ghost.io)
```

## 🔄 Timezone Handling

- **Workflow runs at**: 12:00 PM UTC (7AM Central)
- **Target data**: Previous day's bookings
- **Date calculation**: Automatically adjusts for Central Time

## 📝 Customization

### Change Post Time
Edit `.github/workflows/daily-jail-post.yml`:
```yaml
schedule:
  # Change '0 12' to different time (24-hour UTC format)
  - cron: '0 12 * * *'  # 7AM Central = 12PM UTC
```

### Modify Content
Edit `scripts/deploy-daily-post.js` to customize:
- Post title format
- Content structure  
- Styling and layout
- Error handling

### Add Features
- Email notifications
- Slack integration
- Custom analytics
- Additional data sources

## 🆘 Support

If you encounter issues:

1. **Check the logs** in GitHub Actions
2. **Verify API credentials** in GitHub Secrets  
3. **Test locally** using the development environment
4. **Review recent changes** that might have broken functionality

## ✅ Deployment Checklist

- [ ] Repository created and code pushed
- [ ] GitHub Secrets configured with API keys
- [ ] GitHub Actions enabled
- [ ] Manual test run successful  
- [ ] First automated run scheduled
- [ ] Monitoring setup for failures
- [ ] Documentation updated for team

---

**Ready to go live? 🚀** Once you've completed the setup, your daily jail activity posts will automatically publish every morning at 7AM Central Time!