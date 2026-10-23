const paths = {
  compass: <><circle cx="12" cy="12" r="9" /><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z" /></>,
  vote: <><path d="m9 10 2 2 4-4M7 3h10v12H7zM7 11H4l-2 8v2h20v-2l-2-8h-3M2 17h20" /></>,
  game: <><path d="M7 7h10c3 0 4 3 4 6l1 3c.5 3-2 4-4 2l-3-3H9l-3 3c-2 2-4.5 1-4-2l1-3c0-3 1-6 4-6Z" /><path d="M8 9v5M5.5 11.5h5M16 10h.01M18 13h.01M12 7V3" /></>,
  trophy: <><path d="M7 3h10v6a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 5 4M17 5h4v3a4 4 0 0 1-5 4M12 14v5M8 21h8M9 19h6" /></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
  chevron: <path d="m9 5 7 7-7 7" />,
  down: <path d="m6 9 6 6 6-6" />,
  spark: <path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7ZM20 2v4M18 4h4" />,
  bolt: <path d="m13 2-9 12h7l-1 8 10-12h-7Z" />,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 6" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
  logout: <path d="M10 4H4v16h6M10 12h11m-4-4 4 4-4 4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1" /></>,
}
export default function Icon({ name, size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.spark}</svg>
}
