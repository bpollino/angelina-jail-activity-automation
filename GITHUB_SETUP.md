# GitHub Deployment Commands

## Step 1: Initialize Git Repository (if not already done)
```bash
cd "c:\Users\blake\Desktop\Ghost HTML - Jail Post Design"
git init
```

## Step 2: Add all files to repository
```bash
git add .
```

## Step 3: Create initial commit
```bash
git commit -m "Initial commit: Automated daily jail activity posts with mobile responsiveness"
```

## Step 4: Create GitHub Repository
1. Go to https://github.com
2. Click "New repository" (+ icon in top right)
3. Name it something like: `angelina-jail-activity-automation`
4. Make it **Public** or **Private** (your choice)
5. **Don't** initialize with README (we already have files)
6. Click "Create repository"

## Step 5: Connect and push to GitHub
Replace `YOUR-USERNAME` and `YOUR-REPO-NAME` with your actual values:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```

## Step 6: Set up GitHub Secrets
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret** for each:

### Required Secrets:
- **Name**: `AIRTABLE_API_KEY`
  **Value**: Your Airtable Personal Access Token

- **Name**: `GHOST_ADMIN_API_KEY` 
  **Value**: Your Ghost.io Admin API Key

### Optional Secrets (with defaults):
- **Name**: `AIRTABLE_BASE_ID`
  **Value**: `appBn4Xs7GdnheynS`

- **Name**: `AIRTABLE_TABLE_NAME`
  **Value**: `Angelina County Jail Activity`

- **Name**: `GHOST_API_URL`
  **Value**: `https://angelina-411.ghost.io`

## Step 7: Test the automation
1. Go to **Actions** tab in your repository
2. Click **Daily Jail Activity Post**
3. Click **Run workflow** → **Run workflow**
4. Watch the logs to ensure it works

## Step 8: Monitor daily runs
- The system will automatically run every day at 7AM Central Time
- Check the Actions tab periodically to ensure successful runs
- Posts will be published automatically to Ghost.io

---

## Quick Copy-Paste Commands:

```bash
# Navigate to project folder
cd "c:\Users\blake\Desktop\Ghost HTML - Jail Post Design"

# Initialize git and add files
git init
git add .
git commit -m "Initial commit: Automated daily jail activity posts"

# Connect to GitHub (replace with your repo URL)
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```

## Need Help?
- See DEPLOYMENT.md for detailed troubleshooting
- Check GitHub Actions logs for any errors
- Test locally first with: `npm run deploy`