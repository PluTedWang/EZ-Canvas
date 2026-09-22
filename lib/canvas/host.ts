import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

// Turns what a student types into a Canvas origin, guesses the school from it, and makes sure
// the server only ever calls a public https host with the student's token.

export function normalizeBaseUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).origin;
  } catch {
    return null;
  }
}

export function institutionFromHost(baseUrl: string) {
  const parts = new URL(baseUrl).hostname.split(".");
  const label = parts.length > 2 && parts[0] !== "canvas" ? parts[0] : parts[parts.length - 2];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Loopback, private, link local, carrier grade NAT, multicast and reserved ranges.
const privateRanges = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 3],
] as const) {
  privateRanges.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 127],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  privateRanges.addSubnet(network, prefix, "ipv6");
}

export function isPrivateAddress(address: string) {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (mapped) return isPrivateAddress(mapped[1]);
  const family = isIP(address);
  if (family === 0) return true;
  return privateRanges.check(address, family === 4 ? "ipv4" : "ipv6");
}

export type HostCheck = "ok" | "insecure" | "private" | "unknown";

// Checked before a token is stored, so a typed address can never point the server at itself or
// at another machine on its network.
type Resolve = (host: string, options: { all: true }) => Promise<{ address: string }[]>;

export async function checkCanvasHost(baseUrl: string, resolve: Resolve = lookup): Promise<HostCheck> {
  const url = new URL(baseUrl);
  if (url.protocol !== "https:") return "insecure";
  const host = url.hostname.replace(/^\[|\]$/g, "");
  try {
    const addresses = isIP(host) ? [{ address: host }] : await resolve(host, { all: true });
    return addresses.length > 0 && addresses.every((a) => !isPrivateAddress(a.address)) ? "ok" : "private";
  } catch {
    return "unknown";
  }
}
