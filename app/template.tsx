import type { ReactNode } from "react";

/** Re-mounts on every navigation, so each page plays a short fade-and-rise entrance. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="ae-page">{children}</div>;
}
