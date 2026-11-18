import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "tb_session";

/** 256-bit random token sent to the browser. Only its hash is stored. */
export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Reads one cookie value from a raw Cookie header without extra dependencies. */
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      const value = part.slice(index + 1).trim();
      try {
        return value ? decodeURIComponent(value) : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export interface SessionCookieOptions {
  maxAgeSeconds: number;
  secure: boolean;
}

/** HttpOnly so page scripts cannot read it; SameSite=Lax blocks cross-site POSTs. */
export function serializeSessionCookie(token: string, options: SessionCookieOptions): string {
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${options.maxAgeSeconds}`,
    ...(options.secure ? ["Secure"] : []),
  ].join("; ");
}

export function serializeClearedSessionCookie(secure: boolean): string {
  return serializeSessionCookie("", { maxAgeSeconds: 0, secure });
}
