import { describe, expect, it } from "vitest";
import {
  emailError,
  formatTeamSize,
  isEmailIdentifier,
  joinCodeError,
  normalizeJoinCode,
  parseClassList,
  parseTeamSize,
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

describe("emailError", () => {
  it("accepts a real address in any casing and explains bad ones", () => {
    expect(emailError("  Kim@WICHITA.edu ")).toBeUndefined();
    expect(emailError("")).toMatch(/Enter your email/);
    expect(emailError("kim@wichita")).toMatch(/valid email/);
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

describe("join codes", () => {
  it("normalizes casing, spaces and dashes", () => {
    expect(normalizeJoinCode(" bd8-vef ")).toBe("BD8VEF");
    expect(normalizeJoinCode("bd8 vef")).toBe("BD8VEF");
  });

  it("accepts real codes and explains bad ones", () => {
    expect(joinCodeError("BD8VEF")).toBeUndefined();
    expect(joinCodeError("")).toMatch(/Enter the class code/);
    expect(joinCodeError("BD8VE")).toMatch(/6 letters and numbers/);
    expect(joinCodeError("BD8VE0")).toMatch(/never use 0/);
  });
});

describe("parseTeamSize", () => {
  it("reads a fixed size or a range in any order and spelling", () => {
    expect(parseTeamSize("4")).toEqual({ ok: true, teamSize: 4, teamSizeMax: 4 });
    expect(parseTeamSize("2-3")).toEqual({ ok: true, teamSize: 2, teamSizeMax: 3 });
    expect(parseTeamSize("4-3")).toEqual({ ok: true, teamSize: 3, teamSizeMax: 4 });
    expect(parseTeamSize(" 3 – 5 ")).toEqual({ ok: true, teamSize: 3, teamSizeMax: 5 });
    expect(parseTeamSize("3 to 4")).toEqual({ ok: true, teamSize: 3, teamSizeMax: 4 });
  });

  it("explains sizes it can't use", () => {
    expect(parseTeamSize("")).toMatchObject({ ok: false });
    expect(parseTeamSize("four")).toMatchObject({ ok: false });
    expect(parseTeamSize("1-3")).toMatchObject({ ok: false, error: expect.stringMatching(/2 to 12/) });
    expect(parseTeamSize("10-14")).toMatchObject({ ok: false });
  });

  it("formats sizes for display", () => {
    expect(formatTeamSize(4, 4)).toBe("4");
    expect(formatTeamSize(3, 4)).toBe("3–4");
  });
});

describe("parseClassList", () => {
  it("reads emails pasted in lines, commas or semicolons, lowercased and de-duplicated", () => {
    expect(parseClassList("Ana@School.edu\nben@school.edu, cara@school.edu;\n\n<dev@school.edu> ana@school.edu")).toEqual({
      emails: ["ana@school.edu", "ben@school.edu", "cara@school.edu", "dev@school.edu"],
      invalid: [],
    });
  });

  it("reports anything that isn't an email", () => {
    expect(parseClassList("ana@school.edu, Ben Kim")).toEqual({ emails: ["ana@school.edu"], invalid: ["Ben", "Kim"] });
  });
});

describe("validateCreateCohortRequest", () => {
  it("accepts a class with an optional term", () => {
    expect(validateCreateCohortRequest({ name: "CS 665 Senior Design", teamSize: 4 })).toEqual({
      ok: true,
      value: { name: "CS 665 Senior Design", term: null, teamSize: 4, teamSizeMax: 4 },
    });
  });

  it("accepts a flexible range in either order", () => {
    const result = validateCreateCohortRequest({ name: "CS 665", teamSize: 4, teamSizeMax: 3 });
    expect(result.ok && result.value).toMatchObject({ teamSize: 3, teamSizeMax: 4 });
    expect(validateCreateCohortRequest({ name: "CS 665", teamSize: 3, teamSizeMax: 13 }).ok).toBe(false);
  });

  it("rejects team sizes outside 2–12 and fractional sizes", () => {
    for (const teamSize of [1, 13, 3.5, "4"]) {
      const result = validateCreateCohortRequest({ name: "CS 665", teamSize });
      expect(result.ok).toBe(false);
    }
  });
});
