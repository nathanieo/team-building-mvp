import type { ReactElement } from "react";
import { exitDemoMode, isDemoMode } from "../lib/demoFlag";

/** Small corner badge so it's always clear the app is showing sample data. */
export function DemoBadge(): ReactElement | null {
  if (!isDemoMode()) return null;
  return (
    <div className="demo-badge" role="status">
      <span className="demo-badge__dot" aria-hidden="true" />
      Demo mode · sample data
      <button type="button" className="demo-badge__exit" onClick={exitDemoMode}>
        Exit
      </button>
    </div>
  );
}
