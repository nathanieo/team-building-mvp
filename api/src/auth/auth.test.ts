import { describe, expect, it } from "vitest";
import { LoginRateLimiter } from "./login-rate-limiter.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  createSessionToken,
  hashSessionToken,
  readCookie,
  serializeSessionCookie,
} from "./session-token.js";

describe("password hashing", () => {
  it("verifies the right password and rejects others", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("correct horse batterY", hash)).toBe(false);
  });

  it("salts each hash", async () => {
    expect(await hashPassword("same password")).not.toBe(await hashPassword("same password"));
  });

  it("fails closed on malformed stored hashes", async () => {
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(await verifyPassword("anything", "scrypt$1$2$3$abc$def")).toBe(false);
  });
});

describe("session tokens and cookies", () => {
  it("creates distinct tokens and stable hashes", () => {
    const token = createSessionToken();
    expect(token).not.toBe(createSessionToken());
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toContain(token);
  });

  it("reads one cookie among several", () => {
    expect(readCookie("a=1; tb_session=abc%20d; b=2", "tb_session")).toBe("abc d");
    expect(readCookie("a=1", "tb_session")).toBeNull();
    expect(readCookie(undefined, "tb_session")).toBeNull();
  });

  it("marks the cookie HttpOnly and SameSite, and Secure when asked", () => {
    const cookie = serializeSessionCookie("t", { maxAgeSeconds: 60, secure: true });
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Secure");
    expect(serializeSessionCookie("t", { maxAgeSeconds: 60, secure: false })).not.toContain("Secure");
  });
});

describe("LoginRateLimiter", () => {
  it("blocks after the limit and unblocks when the window passes", () => {
    let now = 0;
    const limiter = new LoginRateLimiter(3, 1_000, () => now);
    for (let attempt = 0; attempt < 3; attempt += 1) limiter.recordFailure("key");
    expect(limiter.isBlocked("key")).toBe(true);
    expect(limiter.isBlocked("other")).toBe(false);
    now = 1_001;
    expect(limiter.isBlocked("key")).toBe(false);
  });

  it("resets after a successful login", () => {
    const limiter = new LoginRateLimiter(1);
    limiter.recordFailure("key");
    limiter.reset("key");
    expect(limiter.isBlocked("key")).toBe(false);
  });
});
