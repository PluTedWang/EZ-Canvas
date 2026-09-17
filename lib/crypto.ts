import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// AES-256-GCM with a key derived from APP_SECRET. Output is base64 of iv + tag + ciphertext.
const ivLength = 12;
const tagLength = 16;

function key() {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error("APP_SECRET is not set");
  return createHash("sha256").update(secret).digest();
}

export function encrypt(plain: string) {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
}

export function decrypt(sealed: string) {
  const buffer = Buffer.from(sealed, "base64");
  const iv = buffer.subarray(0, ivLength);
  const tag = buffer.subarray(ivLength, ivLength + tagLength);
  const data = buffer.subarray(ivLength + tagLength);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
