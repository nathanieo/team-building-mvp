import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router";
import type { Facilitator } from "@team-building-mvp/contracts";
import { useAuth } from "./useAuth";

interface RequireAuthProps {
  children: (facilitator: Facilitator) => ReactElement;
}

/** Renders the page for a logged-in facilitator, otherwise sends them to /login. */
export function RequireAuth({ children }: RequireAuthProps): ReactElement {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === "loading") {
    return (
      <div className="page-loading" role="status">
        Loading…
      </div>
    );
  }
  if (state.status === "signed-out") {
    return <Navigate replace to="/login" state={{ from: location.pathname }} />;
  }
  return children(state.facilitator);
}
