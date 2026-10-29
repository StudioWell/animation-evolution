/**
 * Brand mark: three onion-skin frames trailing a key pose. On hover the frames
 * slide toward the key, like scrubbing a timeline.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={`ae-brandmark ${className ?? ""}`} aria-hidden="true">
      <rect x="3" y="6" width="4" height="16" rx="2" fill="var(--ae-accent)" opacity="0.28" style={{ ["--d" as string]: "6px" }} />
      <rect x="10.5" y="6" width="4" height="16" rx="2" fill="var(--ae-accent)" opacity="0.55" style={{ ["--d" as string]: "3px" }} />
      <rect x="16.5" y="6" width="4" height="16" rx="2" fill="var(--ae-accent)" style={{ ["--d" as string]: "1px" }} />
      <rect x="21.5" y="6" width="4" height="16" rx="2" fill="var(--ae-fg)" />
    </svg>
  );
}
