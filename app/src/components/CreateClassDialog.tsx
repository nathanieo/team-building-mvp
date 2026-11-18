import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { parseTeamSize, validateCreateCohortRequest } from "@team-building-mvp/contracts";
import type { CohortSummary } from "@team-building-mvp/contracts";
import { api, ApiError } from "../lib/api";
import { TextField } from "./TextField";

interface CreateClassDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (cohort: CohortSummary) => void;
  onUnauthorized: () => void;
}

/** Native <dialog> gives focus trapping and Escape-to-close for free. */
export function CreateClassDialog({ open, onClose, onCreated, onUnauthorized }: CreateClassDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  /** What the teacher typed: "4" for a fixed size, or a range like "3-4". */
  const [teamSize, setTeamSize] = useState("4");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setName("");
      setTerm("");
      setTeamSize("4");
      setFieldErrors({});
      setFormError(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const size = parseTeamSize(teamSize);
    const validation = validateCreateCohortRequest({
      name,
      term,
      teamSize: size.ok ? size.teamSize : undefined,
      teamSizeMax: size.ok ? size.teamSizeMax : undefined,
    });
    if (!size.ok || !validation.ok) {
      const errors = validation.ok ? {} : (validation.errors as Record<string, string>);
      // The typed-size message is clearer than the generic number-range one.
      setFieldErrors(size.ok ? errors : { ...errors, teamSize: size.error });
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

        <TextField
          label="Students per team"
          placeholder="4, or a range like 3-4"
          inputMode="text"
          autoComplete="off"
          value={teamSize}
          error={fieldErrors.teamSize}
          onChange={(event) => setTeamSize(event.target.value)}
        />

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
