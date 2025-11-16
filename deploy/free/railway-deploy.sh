#!/bin/bash

# Railway Deployment Script for Tic-Tac-Toe Multiplayer
# This script helps deploy to Railway's free tier

set -e

echo "🚀 Deploying Tic-Tac-Toe Multiplayer to Railway (Free Tier)..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

# Initialize Railway project
echo "🚂 Initializing Railway project..."
railway init

# Create Railway service
echo "🎯 Creating Railway service..."
railway create --name tic-tac-toe-nakama

# Set environment variables
echo "⚙️ Setting environment variables..."
railway variables set NAKAMA_SERVER_KEY=defaultkey
railway variables set NAKAMA_CONSOLE_PASSWORD=password
railway variables set DATABASE_URL=postgresql://postgres:password@localhost:5432/nakama

# Deploy
echo "📤 Deploying to Railway..."
railway up

# Get the deployment URL
echo "⏳ Waiting for deployment to complete..."
sleep 30

RAILWAY_URL=$(railway domain)
echo "✅ Deployment completed!"
echo "🌐 Your Nakama server is running at: https://${RAILWAY_URL}"

# Update frontend configuration
echo "🔧 Updating frontend configuration..."
sed -i "s/127.0.0.1/${RAILWAY_URL}/g" public/index.html
sed -i "s/useSsl: false/useSsl: true/g" public/index.html

echo "📝 Updated public/index.html with Railway URL"
echo "🎮 Your game is ready to play!"

# Instructions for frontend deployment
echo ""
echo "📋 Next Steps:"
echo "1. Commit and push your changes to GitHub"
echo "2. Enable GitHub Pages in your repository settings"
echo "3. Your frontend will be available at: https://yourusername.github.io/tic-tac-toe-multiplayer"
echo ""
echo "🔄 Don't forget to update the mobile app configuration too!"
