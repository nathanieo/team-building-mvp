import { createContext } from "react";
import type {
  Facilitator,
  FacilitatorLoginRequest,
  FacilitatorRegisterRequest,
} from "@team-building-mvp/contracts";

export type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; facilitator: Facilitator };

export interface AuthContextValue {
  state: AuthState;
  login: (request: FacilitatorLoginRequest) => Promise<void>;
  register: (request: FacilitatorRegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  /** Called when any API call returns 401, e.g. after the session expires. */
  handleSessionExpired: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
