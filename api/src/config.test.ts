import { describe, expect, it } from "vitest";
import { readApiConfig } from "./config.js";

const DATABASE_URL = "postgresql://user:secret@127.0.0.1:5434/team_building_mvp";

describe("readApiConfig", () => {
  it("applies defaults", () => {
    expect(readApiConfig({ DATABASE_URL })).toEqual({
      databaseUrl: DATABASE_URL,
      host: "127.0.0.1",
      port: 8788,
      sessionTtlHours: 12,
      sessionCookieSecure: false,
      facilitatorInviteCode: "",
    });
  });

  it("rejects a missing or non-Postgres database URL without echoing it", () => {
    expect(() => readApiConfig({})).toThrow(/DATABASE_URL is required/);
    try {
      readApiConfig({ DATABASE_URL: "mysql://user:secret@host/db" });
    } catch (error) {
      expect(String(error)).not.toContain("secret");
    }
  });

  it("rejects invalid numbers", () => {
    expect(() => readApiConfig({ DATABASE_URL, API_PORT: "99999" })).toThrow(/API_PORT/);
    expect(() => readApiConfig({ DATABASE_URL, SESSION_TTL_HOURS: "0" })).toThrow(/SESSION_TTL_HOURS/);
  });
});
