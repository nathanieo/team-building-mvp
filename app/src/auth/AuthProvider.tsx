import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { api } from "../lib/api";
import { AuthContext } from "./authContext";
import type { AuthContextValue, AuthState } from "./authContext";

/** Restores the facilitator session from the HttpOnly cookie on page load. */
export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then(({ facilitator }) => {
        if (!cancelled) setState({ status: "signed-in", facilitator });
      })
      .catch(() => {
        // 401 means no session. If the API is down, the login form shows that
        // error on the next attempt instead of spinning forever here.
        if (!cancelled) setState({ status: "signed-out" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback<AuthContextValue["login"]>(async (request) => {
    const { facilitator } = await api.login(request);
    setState({ status: "signed-in", facilitator });
  }, []);

  const register = useCallback<AuthContextValue["register"]>(async (request) => {
    const { facilitator } = await api.register(request);
    setState({ status: "signed-in", facilitator });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setState({ status: "signed-out" });
    }
  }, []);

  const handleSessionExpired = useCallback(() => setState({ status: "signed-out" }), []);

  const value = useMemo(
    () => ({ state, login, register, logout, handleSessionExpired }),
    [state, login, register, logout, handleSessionExpired],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
