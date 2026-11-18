import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router";
import { RequireAuth } from "./auth/RequireAuth";
import { DemoBadge } from "./components/DemoBadge";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import JoinPage from "./pages/JoinPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

/** Routes for the facilitator MVP. Student pages are added in the next step. */
function App(): ReactElement {
  return (
    <>
      {/* Development only; production builds drop the badge. */}
      {import.meta.env.DEV ? <DemoBadge /> : null}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/dashboard"
          element={<RequireAuth>{(facilitator) => <DashboardPage facilitator={facilitator} />}</RequireAuth>}
        />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </>
  );
}

export default App;
