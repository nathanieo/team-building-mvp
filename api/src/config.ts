/** Server-only runtime settings read once at startup. */
export interface ApiConfig {
  databaseUrl: string;
  host: string;
  port: number;
  sessionTtlHours: number;
  sessionCookieSecure: boolean;
  /** Empty string means facilitator sign-up is open (local development). */
  facilitatorInviteCode: string;
}

function readInteger(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be a whole number from ${minimum} through ${maximum}.`);
  }
  return value;
}

/** Validates the database URL without including its credentials in diagnostics. */
export function readDatabaseUrl(env: NodeJS.ProcessEnv): string {
  const value = env.DATABASE_URL?.trim();
  if (!value) throw new Error("DATABASE_URL is required. Run npm run setup first.");
  try {
    const url = new URL(value);
    if (!["postgresql:", "postgres:"].includes(url.protocol) || !url.hostname || url.pathname.length <= 1) {
      throw new Error();
    }
  } catch {
    throw new Error("DATABASE_URL must be a PostgreSQL connection URL with a host and database name.");
  }
  return value;
}

export function readApiConfig(env: NodeJS.ProcessEnv): ApiConfig {
  return {
    databaseUrl: readDatabaseUrl(env),
    host: env.API_HOST?.trim() || "127.0.0.1",
    port: readInteger(env, "API_PORT", 8788, 1, 65535),
    sessionTtlHours: readInteger(env, "SESSION_TTL_HOURS", 12, 1, 24 * 30),
    sessionCookieSecure: env.SESSION_COOKIE_SECURE?.trim() === "true",
    facilitatorInviteCode: env.FACILITATOR_INVITE_CODE?.trim() ?? "",
  };
}

export const API_CONFIG = Symbol("API_CONFIG");
