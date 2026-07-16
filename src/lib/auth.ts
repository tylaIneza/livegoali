import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAttemptCount, recordAttempt, clearAttempts } from "@/lib/redis";
import type { UserRole } from "@prisma/client";

// Brute-force protection for the credentials login. Checked by IP (covers
// password spraying across many accounts) and by email (covers credential
// stuffing on one account from many IPs/proxies).
const LOGIN_ATTEMPT_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_ATTEMPTS_PER_IP = 20;
const LOGIN_MAX_ATTEMPTS_PER_EMAIL = 5;

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase();
        const ip = clientIp(request);
        const ipKey = `login:attempts:ip:${ip}`;
        const emailKey = `login:attempts:email:${email}`;

        const [ipAttempts, emailAttempts] = await Promise.all([
          getAttemptCount(ipKey),
          getAttemptCount(emailKey),
        ]);
        if (ipAttempts >= LOGIN_MAX_ATTEMPTS_PER_IP || emailAttempts >= LOGIN_MAX_ATTEMPTS_PER_EMAIL) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          await recordAttempt(ipKey, LOGIN_ATTEMPT_WINDOW_SECONDS);
          await recordAttempt(emailKey, LOGIN_ATTEMPT_WINDOW_SECONDS);
          return null;
        }
        if (user.isBanned) throw new Error("Account suspended");

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          await recordAttempt(ipKey, LOGIN_ATTEMPT_WINDOW_SECONDS);
          await recordAttempt(emailKey, LOGIN_ATTEMPT_WINDOW_SECONDS);
          return null;
        }

        await Promise.all([clearAttempts(ipKey), clearAttempts(emailKey)]);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          isVIP: user.isVIP,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as { role?: UserRole }).role;
        token.isVIP = (user as { isVIP?: boolean }).isVIP;
        token.id = user.id;
      }
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.isVIP = token.isVIP as boolean;
      }
      return session;
    },
  },
});
