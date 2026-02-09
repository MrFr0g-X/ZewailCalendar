import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn(
    "[ZewailCalendar] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET env vars. " +
      "Google Calendar integration will not work. " +
      "See .env.example for setup instructions."
  );
}

async function refreshAccessToken(token: {
  refreshToken?: string;
  accessToken?: string;
  accessTokenExpires?: number;
}) {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" as const };
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || data.error || "Token refresh failed");
    }

    return {
      ...token,
      accessToken: data.access_token as string,
      accessTokenExpires: Date.now() + (data.expires_in as number) * 1000,
      // Keep existing refresh token if a new one wasn't issued
      refreshToken: (data.refresh_token as string) ?? token.refreshToken,
    };
  } catch (error) {
    console.error("[ZewailCalendar] Token refresh failed:", error);
    return { ...token, error: "RefreshAccessTokenError" as const };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in: persist tokens from the OAuth response
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
        };
      }

      // Subsequent requests: check if access token has expired
      const expiresAt = token.accessTokenExpires as number | undefined;
      if (expiresAt && Date.now() < expiresAt - 60_000) {
        // Token still valid (with 60s buffer)
        return token;
      }

      // Token expired — attempt refresh
      return refreshAccessToken(token as Parameters<typeof refreshAccessToken>[0]);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.error = token.error as string | undefined;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
