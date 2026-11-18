import { describe, expect, it } from "vitest";
import {
  validateCreateCohortRequest,
  validateLoginRequest,
  validateRegisterRequest,
} from "./index.js";

describe("validateLoginRequest", () => {
  it("normalizes the email and keeps the password untouched", () => {
    const result = validateLoginRequest({ email: "  Prof@WICHITA.edu ", password: " secret " });
    expect(result).toEqual({
      ok: true,
      value: { email: "prof@wichita.edu", password: " secret " },
    });
  });

  it("reports missing fields", () => {
    const result = validateLoginRequest({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
    }
  });

  it("rejects non-object bodies", () => {
    expect(validateLoginRequest("hello").ok).toBe(false);
  });
});

describe("validateRegisterRequest", () => {
  it("requires a long enough password", () => {
    const result = validateRegisterRequest({
      displayName: "Dr. Kim",
      email: "kim@wichita.edu",
      password: "short",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.password).toMatch(/at least 10/);
  });

  it("accepts a valid registration", () => {
    const result = validateRegisterRequest({
      displayName: " Dr. Kim ",
      email: "kim@wichita.edu",
      password: "correct horse battery",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.displayName).toBe("Dr. Kim");
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
