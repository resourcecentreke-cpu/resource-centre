/**
 * Resource Centre logo — three ascending price bars inside a rounded square,
 * echoing the favicon's coral/amber/mint trio but sharpened into a "price
 * chart" mark. Renders crisply at any size; wordmark optional.
 */
export default function Logo({
  size = 30,
  withWordmark = true,
  dark = false,
  className = '',
}: {
  size?: number;
  withWordmark?: boolean;
  /** true when sitting on a dark background */
  dark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect width="48" height="48" rx="12" fill={dark ? '#FFFFFF' : '#111118'} />
        <rect x="10" y="26" width="7" height="12" rx="2" fill="#FF6B5C" />
        <rect x="20.5" y="19" width="7" height="19" rx="2" fill="#FFC247" />
        <rect x="31" y="10" width="7" height="28" rx="2" fill="#2FD3A5" />
      </svg>
      {withWordmark && (
        <span className="leading-none">
          <span
            className={`block text-[15px] font-bold tracking-tight ${dark ? 'text-white' : 'text-text'}`}
          >
            Resource Centre
          </span>
          <span
            className={`block text-[9.5px] font-semibold uppercase tracking-[0.14em] ${dark ? 'text-white/50' : 'text-faint'}`}
          >
            Compare · Track · Save
          </span>
        </span>
      )}
    </span>
  );
}
