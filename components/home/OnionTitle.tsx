/**
 * The wordmark as an onion-skinned frame: three ghost frames trail the key pose
 * with easing-in spacing. The ghosts are decorative siblings of the <h1> (not
 * inside it), so the heading's text is the title once — for screen readers,
 * search engines and copy-paste — and they wrap identically on every screen.
 */
export function OnionTitle({ text, as: Tag = "h1", id, className }: { text: string; as?: "h1" | "h2"; id?: string; className?: string }) {
  return (
    <div
      className={className ?? "onion stretch-wide text-[clamp(2.6rem,7.4vw,5.6rem)] leading-[0.95] font-bold tracking-[-0.035em] text-fg"}
      style={{ ["--onion-step" as string]: "0.06em" }}
    >
      {[1, 2, 3].map((frame) => (
        <span key={frame} className="onion__ghost" data-frame={frame} aria-hidden="true">
          {text}
        </span>
      ))}
      <Tag id={id} className="onion__key">
        {text}
      </Tag>
    </div>
  );
}
