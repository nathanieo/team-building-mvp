/**
 * Demo mode: a development-only way to use the app without the API or a
 * database. Visit any page with `?demo` to turn it on (remembered in this
 * browser), `?demo=off` or the badge's Exit button to turn it off.
 *
 * Every caller checks `import.meta.env.DEV` first, so production builds
 * drop demo mode and its sample data entirely.
 */
const DEMO_KEY = "tb-demo-mode";

export function isDemoMode(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return window.localStorage.getItem(DEMO_KEY) === "on";
  } catch {
    return false;
  }
}

function setDemoMode(on: boolean): void {
  try {
    if (on) window.localStorage.setItem(DEMO_KEY, "on");
    else window.localStorage.removeItem(DEMO_KEY);
  } catch {
    // Storage can be blocked; demo mode then lasts only until the next reload.
  }
}

/** Reads `?demo` / `?demo=off` from the address bar, then tidies the URL. */
export function applyDemoParam(): void {
  if (!import.meta.env.DEV) return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("demo")) return;
  setDemoMode(url.searchParams.get("demo") !== "off");
  url.searchParams.delete("demo");
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}

export function exitDemoMode(): void {
  setDemoMode(false);
  window.location.assign("/");
}
