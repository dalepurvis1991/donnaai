# Donna AI Deployment Guide

Welcome to the deployment guide for Donna AI (www.donnaai.co.uk)! This guide will help you deploy your app to production.

## Pre-Deployment Checklist

✓ Domain purchased: www.donnaai.co.uk (Squarespace)
✓ All features tested and working
✓ Branding updated from Baron to Donna AI
✓ Database configured with PostgreSQL
✓ All API integrations ready (Gmail, Calendar, OpenAI)

## Step 1: Deploy on Replit

1. Click the **Deploy** button in the Replit editor
2. Select **Production** deployment
3. Replit will automatically:
   - Build your application
   - Set up hosting infrastructure
   - Configure TLS/SSL certificates
   - Create health checks

## Step 2: Connect Your Domain

After deployment, you'll need to connect www.donnaai.co.uk:

1. In Replit Deployments, find your deployed app
2. Click on **Custom Domain**
3. You'll see DNS records to add to Squarespace:
   - Type: CNAME
   - Name: www
   - Value: [your-app].replit.app

4. In Squarespace:
   - Go to Settings → Domains → DNS Settings
   - Add the CNAME record from Replit
   - Save changes

## Step 3: Environment Variables

Make sure these are set in your deployment:
- ✓ DATABASE_URL (already configured)
- ✓ GMAIL_EMAIL & GMAIL_APP_PASSWORD
- ✓ GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET
- ✓ OPENAI_API_KEY
- ✓ SESSION_SECRET

## Step 4: Post-Deployment

1. Test the app at www.donnaai.co.uk (DNS may take 1-48 hours)
2. Monitor logs in Replit Deployments dashboard
3. Share with test users for feedback

## Features Ready for Testing

- ✓ Email categorization (FYI, Draft, Forward)
- ✓ AI-powered chat assistant
- ✓ Smart folder organization
- ✓ Daily business digest
- ✓ Task tracking system
- ✓ Email correlation analysis
- ✓ Calendar integration
- ✓ Memory system for learning patterns

## Support

For deployment issues:
- Check Replit deployment logs
- Verify DNS propagation (can take up to 48 hours)
- Ensure all environment variables are set

Your app is ready for public testing! 🚀