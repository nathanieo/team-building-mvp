/**
 * Field-level validation messages keyed by request property.
 * A missing property means that field passed validation.
 */
export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

/** Result of validating an untrusted request body. */
export type Validation<Value, Field extends string> =
  | { ok: true; value: Value }
  | { ok: false; errors: FieldErrors<Field> };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Returns a trimmed string, or an empty string for any non-string value. */
export function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value.trim() : "";
}
