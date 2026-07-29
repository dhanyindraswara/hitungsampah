// Outline icon set — 24×24, rounded caps, drawn to match the design system's
// Lucide-style stroke. Colour comes from the `stroke` prop so icons can sit on
// dark camera chrome and light cards alike.
const paths = {
  mountain: <path d="m2.5 19 6.2-10.6L12.4 14l2.3-3.7L21.5 19H2.5Z" />,
  mountainDetail: (
    <>
      <path d="m2.5 19 6.2-10.6L12.4 14l2.3-3.7L21.5 19H2.5Z" />
      <path d="m8.7 8.4 1.7-2.9" />
    </>
  ),
  shieldCheck: (
    <>
      <path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  camera: (
    <>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  check: <path d="m20 6-11 11-5-5" />,
  arrowRight: <path d="M5 12h13M13 6l6 6-6 6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4 7h16M9.5 7V5h5v2M6.5 7l.9 13h9.2l.9-13" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="3" />
      <path d="m6 16 4.5-4.5 3.5 3.5 2.5-2.5 3.5 3.5" />
    </>
  ),
  flash: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
  grid: <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8.2v.2M12 11v5" />
    </>
  ),
  warning: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.6v5M12 16.2v.4" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" />
    </>
  ),
  install: <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" />,
};

export default function Icon({ name, size = 24, stroke = 'currentColor', strokeWidth = 2, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
