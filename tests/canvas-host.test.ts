import { expect, test } from "vitest";
import { checkCanvasHost, institutionFromHost, isPrivateAddress, normalizeBaseUrl } from "../lib/canvas/host";

test("normalizeBaseUrl accepts hosts, urls and paths and returns the origin", () => {
  expect(normalizeBaseUrl("canvas.cornell.edu")).toBe("https://canvas.cornell.edu");
  expect(normalizeBaseUrl(" https://cornell.instructure.com/courses/1 ")).toBe("https://cornell.instructure.com");
  expect(normalizeBaseUrl("http://localhost:3100/")).toBe("http://localhost:3100");
  expect(normalizeBaseUrl("")).toBeNull();
  expect(normalizeBaseUrl("not a url")).toBeNull();
});

test("institutionFromHost picks the school label", () => {
  expect(institutionFromHost("https://canvas.cornell.edu")).toBe("Cornell");
  expect(institutionFromHost("https://cornell.instructure.com")).toBe("Cornell");
  expect(institutionFromHost("https://canvas.instructure.com")).toBe("Instructure");
  expect(institutionFromHost("https://lms.example.org")).toBe("Lms");
});

test("loopback, private, link local and metadata addresses are private", () => {
  for (const address of ["127.0.0.1", "10.2.3.4", "172.20.0.1", "192.168.1.10", "169.254.169.254", "100.64.0.1", "0.0.0.0"]) {
    expect(isPrivateAddress(address)).toBe(true);
  }
  for (const address of ["::1", "::", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "not an ip"]) {
    expect(isPrivateAddress(address)).toBe(true);
  }
  expect(isPrivateAddress("151.101.1.140")).toBe(false);
  expect(isPrivateAddress("2606:4700::6810:84e5")).toBe(false);
});

const resolvesTo = (...addresses: string[]) => async () => addresses.map((address) => ({ address }));

test("only a public https host passes", async () => {
  expect(await checkCanvasHost("https://canvas.school.edu", resolvesTo("151.101.1.140"))).toBe("ok");
  expect(await checkCanvasHost("http://canvas.school.edu", resolvesTo("151.101.1.140"))).toBe("insecure");
  expect(await checkCanvasHost("https://localhost:3100", resolvesTo("127.0.0.1"))).toBe("private");
  expect(await checkCanvasHost("https://169.254.169.254")).toBe("private");
  expect(await checkCanvasHost("https://[::1]")).toBe("private");
});

// A name that resolves to a public and a private address could be steered to the private one.
test("a host with any private address is refused", async () => {
  expect(await checkCanvasHost("https://canvas.school.edu", resolvesTo("151.101.1.140", "10.0.0.5"))).toBe("private");
  expect(await checkCanvasHost("https://canvas.school.edu", resolvesTo())).toBe("private");
});

test("a host that does not resolve is reported as unknown", async () => {
  const fails = async () => {
    throw new Error("ENOTFOUND");
  };
  expect(await checkCanvasHost("https://nowhere.invalid", fails)).toBe("unknown");
});
