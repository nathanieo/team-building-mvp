import { randomInt } from "node:crypto";
import { COHORT_LIMITS, JOIN_CODE_ALPHABET } from "@team-building-mvp/contracts";

// The alphabet lives in contracts so the student code box accepts exactly these characters.
export { JOIN_CODE_ALPHABET };

export function generateJoinCode(length: number = COHORT_LIMITS.joinCodeLength): string {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)];
  }
  return code;
}
