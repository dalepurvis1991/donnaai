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

function getOAuth2Client(req: any) {
  const forwardedProto = req.get('X-Forwarded-Proto');
  const protocol = forwardedProto || req.protocol;
  const host = req.get('host');
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  console.log('--- OAuth Redirect Generation ---');
  console.log('X-Forwarded-Proto:', forwardedProto);
  console.log('req.protocol:', req.protocol);
  console.log('req.get("host"):', host);
  console.log('Generated redirectUri:', redirectUri);
  console.log('--------------------------------');

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID?.trim(),
    process.env.GOOGLE_CLIENT_SECRET?.trim(),
    redirectUri
  );
}

export function setupAuth(app: Express) {
  // Only trust proxy in production/deployed environments
  if (process.env.NODE_ENV === 'production' || process.env.REPL_ID) {
    app.set("trust proxy", 1);
  }
  app.use(getSession());

  // --- GOOGLE OAUTH ---
  app.get('/api/login/google', (req, res) => {
    const oauth2Client = getOAuth2Client(req);
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];
    const authUrl = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'consent' });
    res.redirect(authUrl);
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      if (req.query.error) return res.redirect('/?error=oauth_denied');
      const oauth2Client = getOAuth2Client(req);
      const { tokens } = await oauth2Client.getToken(req.query.code as string);
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();

      const user = await storage.upsertUser({
        id: userInfo.id!,
        email: userInfo.email || null,
        firstName: userInfo.given_name || null,
        lastName: userInfo.family_name || null,
        profileImageUrl: userInfo.picture || null,
        emailProvider: 'google',
        googleAccessToken: tokens.access_token || null,
        googleRefreshToken: tokens.refresh_token || null
      });

      (req.session as any).userId = user.id;
      res.redirect('/');
    } catch (error) {
      console.error('Google OAuth Error:', error);
      res.redirect('/?error=callback_failed');
    }
  });

  // --- MICROSOFT OAUTH ---
  app.get('/api/login/microsoft', (req, res) => {
    const tenant = 'common';
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${req.protocol}://${req.get('host')}/api/auth/microsoft/callback`);
    const scopes = encodeURIComponent('offline_access openid profile email https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send');

    const authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${scopes}`;
    res.redirect(authUrl);
  });

  app.get('/api/auth/microsoft/callback', async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) return res.redirect('/?error=no_code');

      const tenant = 'common';
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/microsoft/callback`;

      const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          code: code as string,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();
      if (tokens.error) throw new Error(tokens.error_description);

      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userResponse.json();

      const user = await storage.upsertUser({
        id: userInfo.id,
        email: userInfo.mail || userInfo.userPrincipalName,
        firstName: userInfo.givenName,
        lastName: userInfo.surname,
        emailProvider: 'microsoft',
        microsoftAccessToken: tokens.access_token,
        microsoftRefreshToken: tokens.refresh_token,
      });

      (req.session as any).userId = user.id;
      res.redirect('/');
    } catch (error) {
      console.error('Microsoft OAuth Error:', error);
      res.redirect('/?error=callback_failed');
    }
  });

  app.get('/api/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
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