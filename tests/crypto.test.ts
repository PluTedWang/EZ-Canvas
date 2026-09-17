import { beforeAll, expect, test } from "vitest";
import { decrypt, encrypt } from "../lib/crypto";

beforeAll(() => {
  process.env.APP_SECRET = "test-secret";
});

test("encrypt and decrypt round trip", () => {
  const sealed = encrypt("1234~abcdef");
  expect(sealed).not.toContain("1234~abcdef");
  expect(decrypt(sealed)).toBe("1234~abcdef");
});

test("the same text encrypts differently each time", () => {
  expect(encrypt("token")).not.toBe(encrypt("token"));
});

test("a tampered value does not decrypt", () => {
  const sealed = Buffer.from(encrypt("token"), "base64");
  sealed[sealed.length - 1] ^= 1;
  expect(() => decrypt(sealed.toString("base64"))).toThrow();
});

test("a different secret does not decrypt", () => {
  const sealed = encrypt("token");
  process.env.APP_SECRET = "other-secret";
  expect(() => decrypt(sealed)).toThrow();
  process.env.APP_SECRET = "test-secret";
});
