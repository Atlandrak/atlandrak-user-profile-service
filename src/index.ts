// src/index.ts

// --- IMPORT NECESSARY MODULES ---
// Import the core framework for building the server.
import express from 'express';
// Import middleware for handling user sessions.
import session from 'express-session';
// Import the main library for authentication strategies.
import passport from 'passport';
// Import the specific strategy for Google OAuth 2.0.
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// Import middleware to enable Cross-Origin Resource Sharing (CORS).
import cors from 'cors';
// Import middleware for parsing cookies, needed for session management.
import cookieParser from 'cookie-parser';

// --- INITIALIZE THE EXPRESS APP ---
const app = express();
// Define the port the server will listen on. It uses the port provided by Cloud Run, or 8080 for local testing.
const port = process.env.PORT || 8080;

// --- MIDDLEWARE CONFIGURATION ---
// Use the JSON middleware to parse incoming request bodies.
app.use(express.json());
// Use the cookie parser middleware to handle cookies.
app.use(cookieParser());

// Configure CORS to allow requests from the frontend development server.
// This is crucial for allowing the React app to communicate with the backend.
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://account.atlandrak.com',
  credentials: true, // Allow cookies to be sent from the frontend.
};
app.use(cors(corsOptions));

// Configure express-session for persistent user logins.
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_super_secret_key', // A secret key to sign the session ID cookie.
    resave: false, // Don't save session if unmodified.
    saveUninitialized: false, // Don't create session until something stored.
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS).
      httpOnly: true, // Prevent client-side JS from accessing the cookie.
      maxAge: 24 * 60 * 60 * 1000, // Session duration: 24 hours.
    },
  })
);

// Initialize Passport and configure it to use sessions.
app.use(passport.initialize());
app.use(passport.session());

// --- PASSPORT STRATEGY CONFIGURATION ---
// This is where we tell Passport how to authenticate users with Google.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!, // The Client ID from your Google Cloud credentials.
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!, // The Client Secret.
      callbackURL: '/api/auth/google/callback', // The URL Google redirects to after login.
      proxy: true, // Trust the proxy to handle HTTPS correctly.
    },
    // This function is called when Google successfully authenticates a user.
    (accessToken, refreshToken, profile, done) => {
      // Here, you would typically find or create a user in your database.
      // For now, we'll just pass the Google profile information along.
      console.log('Authenticated user profile:', profile);
      // The 'profile' object contains user info from Google (name, email, photo, etc.).
      return done(null, profile);
    }
  )
);

// Tell Passport how to save the user to the session.
// We only save the user's ID to keep the session cookie small.
passport.serializeUser((user, done) => {
  done(null, user);
});

// Tell Passport how to retrieve the user from the session.
passport.deserializeUser((user: any, done) => {
  // Here, you would fetch the user from the database using the ID.
  // For now, we just return the user object stored in the session.
  done(null, user);
});

// --- AUTHENTICATION ROUTES ---
// The route the frontend redirects to when the "Sign In" button is clicked.
app.get(
  '/api/auth/google',
  // This middleware triggers the Google authentication flow.
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// The callback route that Google redirects to after a successful login.
app.get(
  '/api/auth/google/callback',
  // This middleware handles the response from Google.
  passport.authenticate('google', { failureRedirect: '/login-failed' }),
  (req, res) => {
    // If authentication is successful, redirect the user back to the frontend application.
    res.redirect(process.env.CORS_ORIGIN || 'https://account.atlandrak.com');
  }
);

// A route to log the user out.
app.post('/api/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    // On successful logout, send a success message.
    res.status(200).send({ message: 'Logged out successfully' });
  });
});

// --- PROTECTED API ROUTES ---
// A middleware function to check if a user is authenticated.
const ensureAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.isAuthenticated()) {
    return next(); // If authenticated, proceed to the next handler.
  }
  // If not authenticated, send a 401 Unauthorized error.
  res.status(401).send({ error: 'User not authenticated' });
};

// A protected route to get the current user's profile information.
app.get('/api/profile', ensureAuthenticated, (req, res) => {
  // The authenticated user's profile is available on req.user.
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
