# GitHub Actions Deployment Setup

## Required: Enable GitHub Actions for Pages Deployment

Before the GitHub Actions workflow can deploy your site, you need to update the repository settings.

### Option 1: Automated with Playwright MCP Bridge (Recommended)

If you have the Playwright MCP Bridge Chrome extension installed:

1. **Configure VS Code MCP** (one-time setup):
   - Edit `~/Library/Application Support/Code/User/mcp.json`:
   ```json
   {
     "servers": {
       "playwright": {
         "command": "npx",
         "args": [
           "@playwright/mcp@latest",
           "--extension"
         ]
       }
     },
     "inputs": []
   }
   ```
   - Reload VS Code (`Cmd+Shift+P` → "Reload Window")

2. **Enable GitHub Actions via Copilot**:
   - Ask Copilot to navigate to repository settings
   - Copilot will use your authenticated browser session
   - Settings change automated through MCP Bridge

### Option 2: Manual Configuration (30 seconds)

1. Go to your repository: https://github.com/oviney/blog

2. Click **Settings** (top navigation)

3. Click **Pages** (left sidebar under "Code and automation")

4. Under **Build and deployment**:
   - **Source**: Change from "Deploy from a branch" to **"GitHub Actions"**
   - Click **Save**

5. Push your changes to trigger the workflow:
   ```bash
   git push origin main
   ```

6. Monitor the deployment:
   - Go to **Actions** tab
   - Watch the "Deploy Jekyll site to Pages" workflow
   - Should complete in ~1-2 minutes

7. Verify the site:
   - Visit https://www.viney.ca/
   - Should now display Minimal Mistakes theme

## What Changed:

- **Before**: GitHub Pages automatically built with Jekyll 3.10.0 (limited plugins)
- **After**: GitHub Actions builds with Jekyll 4.3.2 (full plugin support)

## Benefits:

✅ Full Minimal Mistakes theme support  
✅ All plugins enabled (include-cache, paginate, sitemap, gist, jemoji)  
✅ Jekyll 4.x features  
✅ Complete build logs for debugging  
✅ Same deployment target (GitHub Pages)  

## Troubleshooting:

- **Workflow doesn't appear**: Make sure the `.github/workflows/jekyll.yml` file is in your repository
- **Deployment fails**: Check the Actions tab for detailed error logs
- **Site doesn't update**: May take 1-2 minutes after deployment completes

## Next Steps:

Once deployed successfully, the Minimal Mistakes theme will be active with:
- Author profile sidebar
- Table of contents on posts
- Social sharing buttons
- Related posts section
- Search functionality
