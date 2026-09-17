import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { db } from "./db";

const resendApiKey = process.env.RESEND_API_KEY;

export const { handlers, auth, signIn } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Resend({
      apiKey: resendApiKey,
      from: process.env.EMAIL_FROM ?? "EZCanvas <onboarding@resend.dev>",
      // Without a Resend key (local development) the link is printed to the terminal.
      ...(resendApiKey
        ? {}
        : {
            sendVerificationRequest: async ({ identifier, url }) => {
              console.log(`Sign in link for ${identifier}:\n${url}`);
            },
          }),
    }),
  ],
  // Auth.js sends the user back to /signin with ?provider=resend&type=email after the link is sent.
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin",
  },
});
