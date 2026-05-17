import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../utils/prisma";
import { JwtPayload, signToken, signRefreshToken } from "../utils/jwt";
import logger from "../utils/logger";

const router = Router();

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.CORS_ORIGIN}/api/auth/google/callback`,
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const username = profile.displayName?.replace(/\s+/g, "").slice(0, 30) || `user${profile.id}`;

      if (!email) return done(new Error("Google account has no email"));

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: { email, username: `${username}_${Math.random().toString(36).slice(2, 6)}`, password: "" },
        });
        logger.info({ userId: user.id }, "User registered via Google OAuth");
      }

      const payload: JwtPayload = { id: user.id, role: user.role, username: user.username };
      const token = signToken(payload);
      const refreshToken = signRefreshToken(payload);
      done(null, { token, refreshToken, user });
    } catch (err) {
      done(err as Error);
    }
  }));
}

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false, state: "cardplace_oauth" } as any));

router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/login" }), (req, res) => {
  const data = req.user as any;
  // Nastavit refresh token jako httpOnly cookie — token není v URL!
  res.cookie("refreshToken", data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  // Přesměrování bez tokenu v URL, klient použije refresh cookie
  res.redirect(`${process.env.CORS_ORIGIN}/auth-callback`);
});

export default router;