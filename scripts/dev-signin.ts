// Prints a working sign in link without sending email, for local development only.
// EZCanvas has no passwords: Auth.js stores a hash of a one time token, and this
// writes the same hash the real flow would, so the link behaves like an emailed one.
//
// Usage: npm run signin            (the seeded fixture user)
//        npm run signin you@x.edu  (any address; the user is created if missing)
import { randomBytes } from "node:crypto";
import { db } from "../lib/db";

const provider = "resend";
const oneDayMs = 24 * 60 * 60 * 1000;

// Auth.js hashes the token with the Web Crypto API; match it exactly.
async function hash(message: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("dev-signin is for local development only.");
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set. Copy .env.example to .env first.");

  const email = process.argv[2] ?? (await db.user.findFirst({ orderBy: { id: "asc" }, select: { email: true } }))?.email;
  if (!email) throw new Error("No users in the database. Run npm run db:seed, or pass an email address.");

  const user = await db.user.upsert({ where: { email }, update: {}, create: { email } });
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + oneDayMs);
  await db.verificationToken.create({ data: { identifier: email, token: await hash(`${token}${secret}`), expires } });

  const base = process.env.DEV_URL ?? "http://localhost:3000";
  const url = `${base}/api/auth/callback/${provider}?${new URLSearchParams({ callbackUrl: `${base}/`, token, email })}`;
  console.log(`\nSign in as ${user.email}\nOpen this once, within 24 hours:\n\n${url}\n`);
  await db.$disconnect();
}

main();
