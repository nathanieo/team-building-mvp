import { randomInt } from "node:crypto";
import { COHORT_LIMITS } from "@team-building-mvp/contracts";

/** No 0/O, 1/I/L, so codes read cleanly off a projector slide. */
export const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateJoinCode(length: number = COHORT_LIMITS.joinCodeLength): string {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)];
  }
  return code;
}
