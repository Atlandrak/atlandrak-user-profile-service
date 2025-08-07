// src/index.ts

// --- IMPORT NECESSARY MODULES ---
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// --- SECURITY CHECK: VERIFY ENVIRONMENT VARIABLES ---
// This is a critical check. If the Google credentials are not provided
// in the environment where the server is running, the authentication
// will fail. We stop the entire application to prevent it from running
// in a broken state.
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("FATAL ERROR: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not defined.");
  console.error("Please provide these environment variables to the Cloud Run service.");
  process.exit(1); // Stop the process with an error code.
}

// --- INITIALIZE THE EXPRESS APP ---
const app = express();
const port = process.env.PORT || 8080;

// --- MIDDLEWARE CONFIGURATION ---
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://account.atlandrak.com',
  credentials: true,
};
app.use(cors(corsOptions));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_super_secret_key_that_is_long_and_random',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport and configure it to use sessions.
app.use(passport.initialize());
app.use(passport.session());

// --- PASSPORT STRATEGY CONFIGURATION ---
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      proxy: true,
    },
    (accessToken, refreshToken, profile, done) => {
      console.log('Authenticated user profile:', profile);
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// --- AUTHENTICATION ROUTES ---
app.get(
  '/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login-failed' }),
  (req, res) => {
    res.redirect(process.env.CORS_ORIGIN || 'https://account.atlandrak.com');
  }
);

app.post('/api/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.status(200).send({ message: 'Logged out successfully' });
  });
});

// --- PROTECTED API ROUTES ---
const ensureAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send({ error: 'User not authenticated' });
};

app.get('/api/profile', ensureAuthenticated, (req, res) => {
  res.status(200).json(req.user);
});

// A simple health check route to confirm the server is running.
app.get('/api/health', (req, res) => {
    res.status(200).send({ status: 'ok' });
});

// --- START THE SERVER ---
app.listen(port, () => {
  console.log(`[server]: Server is listening on port ${port}`);
});
