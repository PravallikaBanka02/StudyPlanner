# 🚀 Deploying Study Planner to Render

This guide outlines how to deploy your **Study Planner** full-stack application to **[Render](https://render.com/)** on their **Free Tier**.

---

## 📋 Pre-Deployment Checklist

All configuration files have already been prepared in your project:
- ✅ **`render.yaml`**: Pre-configured Blueprint for 1-click deployment.
- ✅ **Root `package.json`**: Configured with start script (`node backend/server.js`) and build steps.
- ✅ **Dynamic Port & Host Binding**: Backend binds to `0.0.0.0` and listens to `process.env.PORT`.
- ✅ **Universal API Routing**: Frontend automatically connects to `/api` on production.
- ✅ **`.gitignore`**: Prevents unnecessary files from cluttering your repository.

---

## Step 1: Push Your Code to GitHub

If you haven't already pushed this project to GitHub, open your terminal (PowerShell, Command Prompt, or Git Bash) in this project folder and run:

```bash
# 1. Initialize git (if not already done)
git init

# 2. Stage all files
git add .

# 3. Create your initial commit
git commit -m "Initial commit for Render deployment"

# 4. Set default branch to main
git branch -M main

# 5. Link your GitHub repository (replace with your actual GitHub repo URL)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# 6. Push your code
git push -u origin main
```

---

## Step 2: Deploy on Render

### Option A: The Fastest Way (Render Blueprint / `render.yaml`)
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click the **"New +"** button in the top right and select **"Blueprint"**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml` with all settings, build commands, and generate a secure `JWT_SECRET`.
5. Click **"Apply"**.
6. Render will build and deploy your project automatically!

---

### Option B: Manual Web Service Setup
If you prefer configuring it manually via the dashboard:

1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **"New +"** -> **"Web Service"**.
3. Select **"Build and deploy from a Git repository"** and choose your repository.
4. Fill in the following settings:
   - **Name**: `study-planner` *(or any unique name you like)*
   - **Region**: Select the region closest to you *(e.g., Oregon (US West), Frankfurt (EU), Singapore (Asia))*
   - **Branch**: `main`
   - **Root Directory**: *(Leave blank)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. Under **Environment Variables**, click **"Add Environment Variable"**:
   - Key: `NODE_ENV` | Value: `production`
   - Key: `JWT_SECRET` | Value: *(Type any random secret string or click generate)*

6. Click **"Deploy Web Service"** at the bottom.

---

## Step 3: Access Your Live Application

1. Render will begin building your project (takes about 1–2 minutes).
2. Once the status shows **"Live"**, you will see your live public URL at the top:
   ```
   https://study-planner-xxxx.onrender.com
   ```
3. Open this URL in any browser on your computer, tablet, or smartphone!

---

## 💡 Notes on Free Tier
- **Spin-down on Inactivity**: On Render's Free tier, services go to sleep after 15 minutes of inactivity. The first request after sleep may take ~30–45 seconds to spin up, after which it runs smoothly.
- **Ephemeral Storage**: On Render's free tier, the local disk is reset whenever the server restarts. Your `server.js` is programmed to automatically regenerate the default tasks and demo accounts whenever the server restarts.
