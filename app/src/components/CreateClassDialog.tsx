import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { COHORT_LIMITS, validateCreateCohortRequest } from "@team-building-mvp/contracts";
import type { CohortSummary } from "@team-building-mvp/contracts";
import { api, ApiError } from "../lib/api";
import { TextField } from "./TextField";

interface CreateClassDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (cohort: CohortSummary) => void;
  onUnauthorized: () => void;
}

const TEAM_SIZES = Array.from(
  { length: COHORT_LIMITS.teamSizeMaximum - COHORT_LIMITS.teamSizeMinimum + 1 },
  (_, index) => COHORT_LIMITS.teamSizeMinimum + index,
);

/** Native <dialog> gives focus trapping and Escape-to-close for free. */
export function CreateClassDialog({ open, onClose, onCreated, onUnauthorized }: CreateClassDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  const [teamSize, setTeamSize] = useState(4);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setName("");
      setTerm("");
      setTeamSize(4);
      setFieldErrors({});
      setFormError(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const validation = validateCreateCohortRequest({ name, term, teamSize });
    if (!validation.ok) {
      setFieldErrors(validation.errors as Record<string, string>);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const { cohort } = await api.createCohort(validation.value);
      onCreated(cohort);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized();
        return;
      }
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(Object.keys(error.fieldErrors).length > 0 ? null : error.message);
      } else {
        setFormError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="dialog" aria-labelledby="create-class-title" onClose={onClose}>
      <form className="stack" noValidate onSubmit={(event) => void handleSubmit(event)}>
        <header className="dialog__header">
          <h2 id="create-class-title">New class</h2>
          <p>Students will join this class with a 6-character code.</p>
        </header>

        {formError ? (
          <div className="alert alert--error" role="alert">
            {formError}
          </div>
        ) : null}

        <TextField
          label="Class name"
          placeholder="CS 665 Senior Design"
          value={name}
          error={fieldErrors.name}
          autoFocus
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          label="Term (optional)"
          placeholder="Spring 2027"
          value={term}
          error={fieldErrors.term}
          onChange={(event) => setTerm(event.target.value)}
        />

        <div className={`field${fieldErrors.teamSize ? " field--invalid" : ""}`}>
          <label className="field__label" htmlFor="team-size">
            Students per team
          </label>
          <div className="field__control">
            <select id="team-size" value={teamSize} onChange={(event) => setTeamSize(Number(event.target.value))}>
              {TEAM_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          {fieldErrors.teamSize ? <p className="field__error">{fieldErrors.teamSize}</p> : null}
        </div>

        <footer className="dialog__actions">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button--primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create class"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
