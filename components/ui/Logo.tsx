interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  /** Show only the icon, no wordmark */
  iconOnly?: boolean;
}

const sizes = {
  xs: { icon: 18, wordmark: 'text-sm' },
  sm: { icon: 22, wordmark: 'text-base' },
  md: { icon: 26, wordmark: 'text-lg' },
  lg: { icon: 34, wordmark: 'text-2xl' },
};

/**
 * SureLeads Listings logo.
 * Icon: 2×2 geometric grid — represents structured listings infrastructure.
 * Wordmark: "SureLeads" (semibold, green) + "Listings" (light, muted slate).
 */
export default function Logo({ size = 'md', className = '', iconOnly = false }: LogoProps) {
  const { icon, wordmark } = sizes[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Geometric 2×2 grid icon */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Top-left: solid brand green */}
        <rect x="1"  y="1"  width="10" height="10" rx="2" fill="#1A6B3C" />
        {/* Top-right: gold accent */}
        <rect x="13" y="1"  width="10" height="10" rx="2" fill="#C9942A" opacity="0.85" />
        {/* Bottom-left: lighter green */}
        <rect x="1"  y="13" width="10" height="10" rx="2" fill="#1A6B3C" opacity="0.35" />
        {/* Bottom-right: faint green */}
        <rect x="13" y="13" width="10" height="10" rx="2" fill="#1A6B3C" opacity="0.15" />
      </svg>

      {!iconOnly && (
        <span className={`${wordmark} leading-none tracking-tight`}>
          <span className="font-bold text-sl-green-500">SureLeads</span>
          <span className="font-light text-sl-slate-400"> Listings</span>
        </span>
      )}
    </div>
  );
}
