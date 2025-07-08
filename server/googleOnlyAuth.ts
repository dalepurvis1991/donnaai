import { google } from 'googleapis';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax'
    },
  });
}

function getOAuth2Client(domain: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `https://${domain}/api/auth/google/callback`
  );
}

export function setupGoogleOnlyAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Login route - redirect to Google
  app.get('/api/login', (req, res) => {
    const oauth2Client = getOAuth2Client(req.hostname);
    
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    console.log(`Redirecting to Google OAuth: ${authUrl}`);
    res.redirect(authUrl);
  });

  // Callback route - handle Google response
  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      console.log(`\n=== GOOGLE CALLBACK ===`);
      console.log(`Code:`, req.query.code ? 'RECEIVED' : 'MISSING');
      console.log(`Error:`, req.query.error || 'NONE');

      if (req.query.error) {
        console.error(`Google OAuth error:`, req.query.error);
        return res.redirect('/?error=oauth_denied');
      }

      if (!req.query.code) {
        console.error('No authorization code received');
        return res.redirect('/?error=no_code');
      }

      const oauth2Client = getOAuth2Client(req.hostname);
      
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(req.query.code as string);
      oauth2Client.setCredentials(tokens);

      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();

      console.log(`User info:`, {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name
      });

      // Store user and tokens
      const user = await storage.upsertUser({
        id: userInfo.id!,
        email: userInfo.email || null,
        firstName: userInfo.given_name || null,
        lastName: userInfo.family_name || null,
        profileImageUrl: userInfo.picture || null,
        googleAccessToken: tokens.access_token || null,
        googleRefreshToken: tokens.refresh_token || null
      });

      // Store user in session
      (req.session as any).userId = user.id;

      console.log(`✅ LOGIN SUCCESS - User ${user.email} logged in`);
      res.redirect('/');
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('/?error=callback_failed');
    }
  });

  // Logout route
  app.get('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.redirect('/');
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({ message: "Unauthorized" });
  }
};