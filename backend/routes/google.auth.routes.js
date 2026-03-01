import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";
import { createSecretToken } from "../utils/SecretToken.js";

const router = express.Router();

/* ── Lazy-initialize the Google strategy only when credentials exist ── */
let strategyRegistered = false;

function ensureStrategy() {
  if (strategyRegistered) return true;

  const clientID     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Guard: don't register if credentials are still placeholders / missing
  if (!clientID || clientID === "your-google-client-id" ||
      !clientSecret || clientSecret === "your-google-client-secret") {
    return false;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: `http://localhost:${process.env.PORT || 8000}/api/v1/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email        = profile.emails?.[0]?.value || "";
          const name         = profile.displayName || "Google User";
          const baseUsername = email.split("@")[0].replace(/[^a-z0-9_]/gi, "_").toLowerCase();

          let user = await User.findOne({
            $or: [{ googleId: profile.id }, { username: baseUsername }],
          });

          if (!user) {
            const payload = {
              name,
              username: baseUsername,
              googleId: profile.id,
              avatar:   profile.photos?.[0]?.value || "",
              password: "",
            };
            if (email) payload.email = email.toLowerCase();
            user = await User.create(payload);
          } else if (!user.googleId) {
            user.googleId = profile.id;
            user.avatar   = user.avatar || profile.photos?.[0]?.value || "";
            if (!user.email && email) user.email = email.toLowerCase();
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  strategyRegistered = true;
  return true;
}

/* ── Step 1: Redirect to Google consent screen ── */
router.get("/google", (req, res, next) => {
  if (!ensureStrategy()) {
    return res.status(503).json({ message: "Google OAuth is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env" });
  }
  passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
});

/* ── Step 2: Google callback — issue JWT cookie and redirect to app ── */
router.get("/google/callback", (req, res, next) => {
  if (!ensureStrategy()) {
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/auth?error=google_not_configured`);
  }
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/auth?error=google_failed`,
  })(req, res, next);
}, (req, res) => {
  const token = createSecretToken(req.user._id);
  res.cookie("token", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge:   3 * 24 * 60 * 60 * 1000,
  });
  res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/home`);
});

export default router;
