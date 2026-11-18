import { describe, expect, it } from "vitest";
import { generateJoinCode, JOIN_CODE_ALPHABET } from "./join-code.js";

describe("generateJoinCode", () => {
  it("makes 6-character codes from the unambiguous alphabet", () => {
    for (let index = 0; index < 200; index += 1) {
      const code = generateJoinCode();
      expect(code).toHaveLength(6);
      for (const character of code) expect(JOIN_CODE_ALPHABET).toContain(character);
    }
  });

  it("never uses look-alike characters", () => {
    expect(JOIN_CODE_ALPHABET).not.toMatch(/[01ILO]/);
  });
});
