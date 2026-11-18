import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { ScryptOptions } from "node:crypto";

/** Built-in scrypt keeps the stack dependency-free; parameters are stored with each hash. */
const PARAMETERS = { N: 2 ** 15, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      KEY_LENGTH,
      { ...options, maxmem: 128 * options.N! * options.r! * 2 },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

/** Returns `scrypt$N$r$p$salt$hash` with base64url salt and hash. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, PARAMETERS);
  return [
    "scrypt",
    PARAMETERS.N,
    PARAMETERS.r,
    PARAMETERS.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

/** Constant-time comparison. Malformed stored hashes simply fail verification. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltText, hashText] = parts;
  const expected = Buffer.from(hashText!, "base64url");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await derive(password, Buffer.from(saltText!, "base64url"), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return timingSafeEqual(actual, expected);
}

/**
 * A valid hash of a random password. Login checks it when the email is unknown
 * so response time does not reveal which emails have accounts.
 */
export const DUMMY_PASSWORD_HASH: Promise<string> = hashPassword(
  randomBytes(24).toString("hex"),
);
