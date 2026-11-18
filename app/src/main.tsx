import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./auth/AuthProvider";
import App from "./App.tsx";
import { applyDemoParam } from "./lib/demoFlag";
import "./index.css";

// Development only: `?demo` in the address bar switches demo mode on (see lib/demoFlag.ts).
if (import.meta.env.DEV) applyDemoParam();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Application root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
