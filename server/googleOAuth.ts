import { google } from 'googleapis';
import type { Express } from 'express';
import { storage } from './storage';
import { isAuthenticated } from './replitAuth';

// Get the current domain for redirect URI
const getRedirectUri = (req: any) => {
  const protocol = req.get('X-Forwarded-Proto') || req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/api/auth/google/callback`;
};

const createOAuthClient = (req: any) => {
  console.log('Creating OAuth client - Environment check:', {
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    clientIdLength: process.env.GOOGLE_CLIENT_ID?.length,
    secretLength: process.env.GOOGLE_CLIENT_SECRET?.length,
    redirectUri: getRedirectUri(req)
  });
  
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri(req)
  );
};

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly'
];

export function setupGoogleAuth(app: Express) {
  // Initiate Google OAuth
  app.get('/api/auth/google', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Must be logged in to connect Google services' });
    }

    const oauth2Client = createOAuthClient(req);
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: req.user.claims.sub, // Pass user ID in state
    });

    res.redirect(authUrl);
  });

  // Handle Google OAuth callback
  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.redirect('/?error=missing_code');
      }

      const userId = state as string;
      const oauth2Client = createOAuthClient(req);
      
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getAccessToken(code as string);
      
      if (!tokens.access_token) {
        return res.redirect('/?error=no_access_token');
      }

      // Update user with Google tokens
      const user = await storage.getUser(userId);
      if (user) {
        await storage.upsertUser({
          ...user,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token || user.googleRefreshToken,
        });
      }

      res.redirect('/?google_connected=true');
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('/?error=oauth_failed');
    }
  });

  // Check Google connection status
  app.get('/api/auth/google/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      console.log('Google status check for user:', userId, 'has token:', !!(user?.googleAccessToken));
      
      res.json({
        connected: !!(user?.googleAccessToken),
        hasGmail: !!(user?.googleAccessToken),
        hasCalendar: !!(user?.googleAccessToken),
      });
    } catch (error) {
      console.error('Error checking Google status:', error);
      res.status(500).json({ message: 'Failed to check Google status' });
    }
  });
}