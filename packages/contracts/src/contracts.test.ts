import { describe, expect, it } from "vitest";
import {
  isEmailIdentifier,
  validateCreateCohortRequest,
  validateLoginRequest,
  validateRegisterRequest,
} from "./index.js";

describe("validateLoginRequest", () => {
  it("normalizes an email or username and keeps the password untouched", () => {
    expect(validateLoginRequest({ identifier: "  Prof@WICHITA.edu ", password: " secret " })).toEqual({
      ok: true,
      value: { identifier: "prof@wichita.edu", password: " secret " },
    });
    expect(validateLoginRequest({ identifier: " Dr.Kim ", password: "secret" })).toEqual({
      ok: true,
      value: { identifier: "dr.kim", password: "secret" },
    });
  });

  it("reports missing fields", () => {
    const result = validateLoginRequest({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.identifier).toBeDefined();
      expect(result.errors.password).toBeDefined();
    }
  });

  it("rejects non-object bodies", () => {
    expect(validateLoginRequest("hello").ok).toBe(false);
  });
});

describe("isEmailIdentifier", () => {
  it("treats anything with @ as an email", () => {
    expect(isEmailIdentifier("kim@wichita.edu")).toBe(true);
    expect(isEmailIdentifier("dr.kim")).toBe(false);
  });
});

describe("validateRegisterRequest", () => {
  const valid = {
    displayName: " Dr. Kim ",
    username: " Dr.Kim ",
    email: "kim@wichita.edu",
    password: "correct horse battery",
  };

  it("requires a long enough password", () => {
    const result = validateRegisterRequest({ ...valid, password: "short" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.password).toMatch(/at least 10/);
  });

  it("accepts a valid registration and lowercases the username", () => {
    const result = validateRegisterRequest(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.displayName).toBe("Dr. Kim");
      expect(result.value.username).toBe("dr.kim");
    }
  });

  it("requires a username", () => {
    const result = validateRegisterRequest({ ...valid, username: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.username).toMatch(/Choose a username/);
  });

  it("rejects usernames that are the wrong length or use other characters", () => {
    for (const username of ["ab", "a".repeat(31), "kim@wsu", "dr kim", ".kim", "kim_", "kim-lee"]) {
      const result = validateRegisterRequest({ ...valid, username });
      expect(result.ok, username).toBe(false);
      if (!result.ok) expect(result.errors.username, username).toBeDefined();
    }
    for (const username of ["kim", "dr.kim", "kim_lee2", "k1m"]) {
      expect(validateRegisterRequest({ ...valid, username }).ok, username).toBe(true);
    }
  });
});

describe("validateCreateCohortRequest", () => {
  it("accepts a class with an optional term", () => {
    expect(validateCreateCohortRequest({ name: "CS 665 Senior Design", teamSize: 4 })).toEqual({
      ok: true,
      value: { name: "CS 665 Senior Design", term: null, teamSize: 4 },
    });
  });

  it("rejects team sizes outside 2–12 and fractional sizes", () => {
    for (const teamSize of [1, 13, 3.5, "4"]) {
      const result = validateCreateCohortRequest({ name: "CS 665", teamSize });
      expect(result.ok).toBe(false);
    }
  });
});
