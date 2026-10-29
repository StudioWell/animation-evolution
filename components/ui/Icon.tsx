import type { SVGProps } from "react";

/**
 * One icon set, one visual style: 24px grid, 1.6 stroke, round joins.
 * Icons are decorative by default (aria-hidden); give the parent control a label.
 */
const PATHS = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  external: <><path d="M14 4h6v6" /><path d="M20 4 10.5 13.5" /><path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4.2l2.6 1.6" /></>,
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  sort: <><path d="M8 5v14M8 19l-3-3M8 19l3-3" /><path d="M16 19V5M16 5l-3 3M16 5l3 3" /></>,
  info: <><circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 8h.01" /></>,
  alert: <><path d="M12 4 3 19.5h18L12 4Z" /><path d="M12 10v4.5M12 17h.01" /></>,
  refresh: <><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" /><path d="M19.5 4.5v4.2h-4.2" /></>,
  home: <><path d="M4 11 12 4l8 7" /><path d="M6 9.5V20h12V9.5" /></>,
  film: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 9h16M4 15h16M8 5v4M8 15v4M16 5v4M16 15v4" /></>,
  layers: <><path d="m12 4 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4" /><path d="m4 16 8 4 8-4" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  settings: <><circle cx="12" cy="12" r="2.6" /><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" /></>,
  book: <><path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v14H6.5A1.5 1.5 0 0 0 5 19.5v-14Z" /><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19" /></>,
  play: <path d="M8 5.5v13l10.5-6.5L8 5.5Z" />,
  sparkle: <path d="M12 4v4M12 16v4M4 12h4M16 12h4M7 7l2 2M15 15l2 2M17 7l-2 2M9 15l-2 2" />,
  globe: <><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.2 2.4 3.3 5 3.3 8s-1.1 5.6-3.3 8c-2.2-2.4-3.3-5-3.3-8S9.8 6.4 12 4Z" /></>,
  image: <><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m5 17 4.5-4.5L13 16l2.5-2.5L19 17" /></>,
  database: <><ellipse cx="12" cy="6.5" rx="7" ry="2.5" /><path d="M5 6.5v11c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-11" /><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" /></>,
  figure: <><circle cx="12" cy="5" r="1.9" /><path d="M12 7.6v6" /><path d="m7.5 11 4.5-1.6 4.5 1.6" /><path d="m9.2 20.5 2.8-6.9 2.8 6.9" /></>,
  scan: <><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" /><path d="M8 12h8" /></>,
  user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></>,
  tag: <><path d="M4 4h7.2l8.3 8.3a1.7 1.7 0 0 1 0 2.4l-4.8 4.8a1.7 1.7 0 0 1-2.4 0L4 11.2V4Z" /><circle cx="8.3" cy="8.3" r="1.3" /></>,
  bookmark: <path d="M6.5 4h11A1.5 1.5 0 0 1 19 5.5V20l-7-4.2L5 20V5.5A1.5 1.5 0 0 1 6.5 4Z" />,
  logout: <><path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" /><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" /></>,
  camera: <><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3L9.5 4.5h5L16.2 7h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z" /><circle cx="12" cy="12.8" r="3.3" /></>,
  pencil: <><path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L15.5 4.5Z" /><path d="m13.5 6.5 3 3" /></>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  upload: <><path d="M12 15V4.5M7.5 9 12 4.5 16.5 9" /><path d="M4.5 14.5v3A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5v-3" /></>,
  shield: <><path d="M12 3.8 5 6.5v5.2c0 4.2 2.9 7.3 7 8.5 4.1-1.2 7-4.3 7-8.5V6.5l-7-2.7Z" /><path d="m9 12 2.2 2.2L15.2 10" /></>,
  bell: <><path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5l1.5-1.5Z" /><path d="M10 20.5a2.1 2.1 0 0 0 4 0" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  trash: <><path d="M4.5 7h15M9.5 7V4.5h5V7" /><path d="M6.5 7l.9 11.6A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.4L17.5 7" /></>,
  users: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19.5c.7-3.3 3.1-5 6-5s5.3 1.7 6 5" /><path d="M15.5 5.5a3 3 0 0 1 0 6M17.5 14.8c1.8.6 3 2.2 3.5 4.7" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
