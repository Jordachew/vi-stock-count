interface Props {
  size?: number
  className?: string
}

export function VILogo({ size = 32, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="vi-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#be185d" />
        </linearGradient>
        <linearGradient id="vi-shine" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* Rounded square base */}
      <rect width="40" height="40" rx="10" fill="url(#vi-grad)" />
      {/* Shine overlay */}
      <rect width="40" height="40" rx="10" fill="url(#vi-shine)" />

      {/* Decorative top bow accent */}
      <path
        d="M14 9 Q20 6 26 9"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="20" cy="9" r="1.2" fill="rgba(255,255,255,0.7)" />

      {/* V — elegant, slightly wide */}
      <path
        d="M9 15 L17 28 L20 23 L23 28 L31 15"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* I — small roman numeral below, centered */}
      <line x1="20" y1="29.5" x2="20" y2="34" stroke="rgba(255,255,255,0.75)" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="17.5" y1="29.5" x2="22.5" y2="29.5" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="17.5" y1="34" x2="22.5" y2="34" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/** Wordmark variant — logo + "Valentine's Intimates Limited" text */
export function VIWordmark({ logoSize = 28 }: { logoSize?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <VILogo size={logoSize} />
      <div className="leading-tight">
        <div className="text-white font-bold text-sm tracking-wide">Valentine&apos;s</div>
        <div className="text-pink-300 text-[10px] font-medium tracking-[0.15em] uppercase">Intimates Limited</div>
      </div>
    </div>
  )
}
