# Free Cloud Deployment Guide

This guide shows how to deploy your Tic-Tac-Toe multiplayer game using completely free services.

## Option 1: GitHub Pages + Railway (Free Tier)

### Frontend Deployment (GitHub Pages - Free)

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/tic-tac-toe-multiplayer.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: main, folder: /root
   - Save

3. **Update Frontend Configuration**
   - Edit `public/index.html`
   - Update Nakama host to your Railway URL (see below)

### Backend Deployment (Railway - Free Tier)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub (free)

2. **Deploy Nakama Server**
   - Click "New Project"
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Docker

3. **Configure Environment Variables**
   In Railway project settings, add:
   ```
   NAKAMA_DATABASE_URL=postgresql://postgres:password@localhost:5432/nakama
   NAKAMA_SERVER_KEY=defaultkey
   NAKAMA_CONSOLE_PASSWORD=password
   ```

4. **Get Your URL**
   - Railway will give you a URL like: `tic-tac-toe-nakama.up.railway.app`

## Option 2: Vercel + Render (Free Tier)

### Frontend (Vercel - Free)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy Frontend**
   ```bash
   vercel --prod
   ```

### Backend (Render - Free)

1. **Create Render Account**
   - Go to https://render.com
   - Sign up (free tier available)

2. **Create Web Service**
   - Click "New +"
   - "Web Service"
   - Connect GitHub repository
   - Runtime: Docker
   - Start Command: `/nakama/nakama server --config /nakama/data/config.yml`

3. **Environment Variables**
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/nakama
   NAKAMA_SERVER_KEY=defaultkey
   ```

## Option 3: Glitch (Free Hosting)

### Complete Game on Glitch

1. **Go to https://glitch.com**
2. **Click "New Project"**
3. **Choose "Import from GitHub"**
4. **Enter your repository URL**

Glitch provides:
- Free hosting
- Built-in database (PostgreSQL)
- Custom URL: `your-project-name.glitch.me`

## Option 4: Firebase + Cloud Functions

### Frontend (Firebase Hosting - Free)

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase**
   ```bash
   firebase init hosting
   ```

3. **Deploy**
   ```bash
   firebase deploy
   ```

### Backend (Cloud Functions - Free Tier)

1. **Create `functions/index.js`**
   ```javascript
   const functions = require('firebase-functions');

   exports.nakamaProxy = functions.https.onRequest((req, res) => {
     // Proxy requests to your Nakama server
     // You'll need to host Nakama elsewhere or use a different approach
   });
   ```

## Option 5: Self-Hosted with Ngrok (Development)

### Local Development with Public Access

1. **Start Local Services**
   ```bash
   docker-compose up -d
   ```

2. **Install Ngrok**
   ```bash
   npm install ngrok -g
   ```

3. **Expose Local Server**
   ```bash
   ngrok http 7350
   ```

4. **Update Frontend**
   - Use the ngrok URL in `public/index.html`

## Production URLs (Update .env.example)

After deployment, update your `.env.example`:

```bash
# Free Hosting URLs
PRODUCTION_NAKAMA_HOST=your-project-name.up.railway.app
PRODUCTION_DATABASE_URL=postgresql://postgres:password@your-db-host:5432/nakama
PRODUCTION_FRONTEND_URL=https://yourusername.github.io/tic-tac-toe-multiplayer
PRODUCTION_MOBILE_API_URL=https://your-project-name.up.railway.app
```

## Recommended: Railway + GitHub Pages

This combination is completely free and reliable:

1. **Frontend**: GitHub Pages (unlimited static hosting)
2. **Backend**: Railway (750 hours/month free)
3. **Database**: Railway PostgreSQL (free tier)

Total cost: $0/month

## Next Steps

1. Choose your preferred free hosting option
2. Update the configuration files with your URLs
3. Deploy and test the multiplayer functionality
4. Share your game URL with friends!
