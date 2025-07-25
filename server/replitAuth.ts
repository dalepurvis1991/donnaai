import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

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

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      console.log('OAuth verification started for user:', tokens.claims().sub);
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      console.log('OAuth verification completed for user:', tokens.claims().sub);
      verified(null, user);
    } catch (error) {
      console.error('OAuth verification failed:', error);
      verified(error, null);
    }
  };

  const domains = process.env.REPLIT_DOMAINS!.split(",");
  console.log(`All available domains: ${domains.join(", ")}`);
  
  for (const domain of domains) {
    console.log(`Setting up Replit OAuth for domain: ${domain}`);
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }
  
  // Also setup for the custom domain
  const customDomain = "baron-inbox-dalepurvis.replit.app";
  console.log(`Setting up Replit OAuth for custom domain: ${customDomain}`);
  const customStrategy = new Strategy(
    {
      name: `replitauth:${customDomain}`,
      config,
      scope: "openid email profile offline_access",
      callbackURL: `https://${customDomain}/api/callback`,
    },
    verify,
  );
  passport.use(customStrategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    console.log(`Login request from: ${req.hostname}`);
    const strategyName = `replitauth:${req.hostname}`;
    console.log(`Using strategy: ${strategyName}`);
    
    // Check if strategy exists
    if (!passport._strategies[strategyName]) {
      console.error(`Strategy ${strategyName} not found. Available strategies:`, Object.keys(passport._strategies));
      return res.status(500).json({ error: "Authentication strategy not found" });
    }
    
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    console.log(`\n=== CALLBACK REQUEST ===`);
    console.log(`Host: ${req.hostname}`);
    console.log(`URL: ${req.url}`);
    console.log(`Query params:`, req.query);
    console.log(`Headers:`, JSON.stringify(req.headers, null, 2));
    
    const strategyName = `replitauth:${req.hostname}`;
    
    if (!passport._strategies[strategyName]) {
      console.error(`ERROR: Strategy ${strategyName} not found`);
      console.log(`Available strategies:`, Object.keys(passport._strategies));
      return res.redirect("/api/login");
    }
    
    console.log(`Using strategy: ${strategyName}`);
    
    passport.authenticate(strategyName, (err, user, info) => {
      console.log(`Auth result - Error:`, err);
      console.log(`Auth result - User:`, user ? 'USER_FOUND' : 'NO_USER');
      console.log(`Auth result - Info:`, info);
      
      if (err) {
        console.error(`Authentication error:`, err);
        return res.redirect("/api/login?error=auth_failed");
      }
      
      if (!user) {
        console.error(`No user returned from authentication`);
        return res.redirect("/api/login?error=no_user");
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error(`Login error:`, err);
          return res.redirect("/api/login?error=login_failed");
        }
        
        console.log(`✅ LOGIN SUCCESS - Redirecting to /`);
        return res.redirect("/");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};