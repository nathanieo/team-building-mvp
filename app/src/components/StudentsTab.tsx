import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { CLASS_LIST_LIMITS, parseClassList } from "@team-building-mvp/contracts";
import type { ClassStudent } from "@team-building-mvp/contracts";
import { api, ApiError } from "../lib/api";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; students: ClassStudent[] };

type Filter = "all" | "joined" | "missing";

/** Joined students first, then the rest, each alphabetical by name or email. */
function sortStudents(students: ClassStudent[]): ClassStudent[] {
  return [...students].sort((a, b) => {
    if (a.joined !== b.joined) return a.joined ? -1 : 1;
    return (a.displayName ?? a.email).localeCompare(b.displayName ?? b.email);
  });
}

function initials(student: ClassStudent): string {
  if (student.displayName) {
    const parts = student.displayName.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
  }
  return (student.email[0] ?? "?").toUpperCase();
}

function ClassListForm({
  cohortId,
  onSaved,
  onCancel,
  onUnauthorized,
}: {
  cohortId: string;
  onSaved: (students: ClassStudent[]) => void;
  onCancel: () => void;
  onUnauthorized: () => void;
}): ReactElement {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const { emails, invalid } = parseClassList(text);
    if (invalid.length > 0) {
      setError(`These don't look like emails: ${invalid.slice(0, 5).join(", ")}${invalid.length > 5 ? "…" : ""}`);
      return;
    }
    if (emails.length === 0) {
      setError("Paste at least one student email.");
      return;
    }
    if (emails.length > CLASS_LIST_LIMITS.maximumEmails) {
      setError(`Add up to ${CLASS_LIST_LIMITS.maximumEmails} emails at a time.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { students } = await api.addClassList(cohortId, { emails });
      onSaved(students);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onUnauthorized();
        return;
      }
      setError(caught instanceof ApiError ? caught.message : "Couldn't save the class list. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="class-list-form" noValidate onSubmit={(event) => void handleSubmit(event)}>
      <label className="field__label" htmlFor="class-list-emails">
        Student emails
      </label>
      <textarea
        id="class-list-emails"
        value={text}
        placeholder={"ana@school.edu\nben@school.edu"}
        autoFocus
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "class-list-error" : undefined}
        onChange={(event) => {
          setText(event.target.value);
          setError(null);
        }}
      />
      {error ? (
        <p className="field__error" id="class-list-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="class-list-form__actions">
        <button type="button" className="button button--ghost button--small" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button button--primary button--small" disabled={saving}>
          {saving ? "Adding…" : "Add students"}
        </button>
      </div>
    </form>
  );
}

/** Everyone on the class list, marked joined or not, with a filter and an "Add class list" form. */
export function StudentsTab({ cohortId, onUnauthorized }: { cohortId: string; onUnauthorized: () => void }): ReactElement {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);
  /** Email of the student whose "Remove from class?" confirmation is showing. */
  const [confirming, setConfirming] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function removeStudent(email: string): Promise<void> {
    setRemoving(true);
    setRemoveError(null);
    try {
      const { students } = await api.removeStudent(cohortId, email);
      setLoad({ status: "ready", students: sortStudents(students) });
      setConfirming(null);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onUnauthorized();
        return;
      }
      setRemoveError(caught instanceof ApiError ? caught.message : "Couldn't remove the student. Try again.");
    } finally {
      setRemoving(false);
    }
  }

  const fetchStudents = useCallback(async () => {
    setLoad({ status: "loading" });
    try {
      const { students } = await api.listStudents(cohortId);
      setLoad({ status: "ready", students: sortStudents(students) });
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onUnauthorized();
        return;
      }
      setLoad({
        status: "error",
        message: caught instanceof ApiError ? caught.message : "Couldn't load the students.",
      });
    }
  }, [cohortId, onUnauthorized]);

  useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  if (load.status === "loading") {
    return (
      <div className="student-list" aria-busy="true">
        <div className="student-row student-row--skeleton" />
        <div className="student-row student-row--skeleton" />
        <div className="student-row student-row--skeleton" />
      </div>
    );
  }

  if (load.status === "error") {
    return (
      <div className="alert alert--error" role="alert">
        {load.message}{" "}
        <button type="button" className="link-button" onClick={() => void fetchStudents()}>
          Try again
        </button>
      </div>
    );
  }

  const joinedCount = load.students.filter((student) => student.joined).length;
  const missingCount = load.students.length - joinedCount;
  const shown = load.students.filter((student) =>
    filter === "all" ? true : filter === "joined" ? student.joined : !student.joined,
  );
  const filters: Array<{ id: Filter; label: string; count: number }> = [
    { id: "all", label: "All", count: load.students.length },
    { id: "joined", label: "Joined", count: joinedCount },
    { id: "missing", label: "Not joined", count: missingCount },
  ];

  const form = adding ? (
    <ClassListForm
      cohortId={cohortId}
      onCancel={() => setAdding(false)}
      onUnauthorized={onUnauthorized}
      onSaved={(students) => {
        setLoad({ status: "ready", students: sortStudents(students) });
        setAdding(false);
      }}
    />
  ) : null;

  if (load.students.length === 0) {
    return (
      <>
        {form}
        {adding ? null : (
          <div className="drawer-empty">
            <h3>No students yet</h3>
            <p>Add your class list to see who still needs to join.</p>
            <button type="button" className="button button--primary button--small" onClick={() => setAdding(true)}>
              Add class list
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="student-toolbar">
        <div className="filter-chips" role="group" aria-label="Show students">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className="filter-chip"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label} <span className="filter-chip__count">{item.count}</span>
            </button>
          ))}
        </div>
        {adding ? null : (
          <button type="button" className="button button--ghost button--small" onClick={() => setAdding(true)}>
            Add class list
          </button>
        )}
      </div>

      {form}

      {shown.length === 0 ? (
        <p className="student-list__none">
          {filter === "joined" ? "Nobody has joined yet." : "Everyone on the list has joined."}
        </p>
      ) : (
        <ul className="student-list">
          {shown.map((student) => {
            const name = student.displayName ?? student.email;
            const isConfirming = confirming === student.email;
            return (
              <li
                key={student.email}
                className={`student-row${student.joined ? "" : " student-row--missing"}${
                  isConfirming ? " student-row--confirming" : ""
                }`}
              >
                <div className="student-row__main">
                  <span className="student-row__avatar" aria-hidden="true">
                    {initials(student)}
                  </span>
                  <span className="student-row__text">
                    <span className="student-row__name">{name}</span>
                    <span className="student-row__sub" title={student.joined ? student.email : undefined}>
                      {student.joined
                        ? [
                            student.studentId ? `ID ${student.studentId}` : student.email,
                            student.finished ? "Questionnaires done" : "Answering questionnaires",
                          ].join(" · ")
                        : "Hasn't joined with the code yet"}
                    </span>
                  </span>
                  <span className={`join-status join-status--${student.joined ? "joined" : "missing"}`}>
                    {student.joined ? "Joined" : "Not joined"}
                  </span>
                  <button
                    type="button"
                    className="student-row__remove"
                    aria-label={`Remove ${name} from the class`}
                    title="Remove from class"
                    disabled={isConfirming}
                    onClick={() => {
                      setConfirming(student.email);
                      setRemoveError(null);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                    </svg>
                  </button>
                </div>

                {isConfirming ? (
                  <div className="student-row__confirm" role="group" aria-label={`Confirm removing ${name}`}>
                    <span>
                      Remove <strong>{name}</strong> from the class?
                    </span>
                    <span className="student-row__confirm-actions">
                      <button
                        type="button"
                        className="button button--ghost button--small"
                        disabled={removing}
                        onClick={() => setConfirming(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="button button--danger button--small"
                        disabled={removing}
                        autoFocus
                        onClick={() => void removeStudent(student.email)}
                      >
                        {removing ? "Removing…" : "Remove"}
                      </button>
                    </span>
                    {removeError ? (
                      <p className="field__error" role="alert">
                        {removeError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
