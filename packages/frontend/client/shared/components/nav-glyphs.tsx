import type { ComponentProps } from "react";

export interface NavGlyphProps {
  filled?: boolean;
  className?: string;
}

function Svg({
  filled,
  className,
  children,
  ...props
}: ComponentProps<"svg"> & { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeGlyph({ filled = false, className }: NavGlyphProps) {
  return (
    <Svg filled={filled} className={className}>
      <path d="M4 10.9 12 4.2l8 6.7v8.3a1.5 1.5 0 0 1-1.5 1.5H15v-4.3a3 3 0 0 0-6 0v4.3H5.5A1.5 1.5 0 0 1 4 19.2v-8.3Z" />
    </Svg>
  );
}

export function ExploreGlyph({ filled = false, className }: NavGlyphProps) {
  return (
    <Svg filled={filled} className={className}>
      <circle cx="16.9" cy="6.7" r="2.2" />
      <path d="M2.6 19.4l5.2-7.2a1.35 1.35 0 0 1 2.2 0l2.5 3.4 1.6-2.1a1.35 1.35 0 0 1 2.15 0l5.15 5.9H2.6Z" />
    </Svg>
  );
}

export function AboutGlyph({ filled = false, className }: NavGlyphProps) {
  if (filled) {
    return (
      <Svg filled className={className}>
        <path d="M11.3 6.6C9.6 5.2 7.2 4.7 4.7 5.1a1.1 1.1 0 0 0-.9 1.1v10.9a1.1 1.1 0 0 0 1.3 1.1c2-.3 4.2 0 6.2 1.4V6.6Z" />
        <path d="M12.7 6.6c1.7-1.4 4.1-1.9 6.6-1.5a1.1 1.1 0 0 1 .9 1.1v10.9a1.1 1.1 0 0 1-1.3 1.1c-2-.3-4.2 0-6.2 1.4V6.6Z" />
      </Svg>
    );
  }
  return (
    <Svg filled={false} className={className}>
      <path d="M12 6.3C10.2 4.9 7.6 4.4 4.9 4.9a1.2 1.2 0 0 0-1 1.2v10.8a1.2 1.2 0 0 0 1.4 1.2c2.3-.4 4.7 0 6.7 1.6 2-1.6 4.4-2 6.7-1.6a1.2 1.2 0 0 0 1.4-1.2V6.1a1.2 1.2 0 0 0-1-1.2c-2.7-.5-5.3 0-7.1 1.4Z" />
      <path d="M12 6.3v13.4" />
    </Svg>
  );
}

export function BookingsGlyph({ filled = false, className }: NavGlyphProps) {
  return (
    <Svg filled={filled} className={className}>
      {filled ? (
        <path
          fillRule="evenodd"
          d="M6 5h12a2.2 2.2 0 0 1 2.2 2.2v11.6a2.2 2.2 0 0 1-2.2 2.2H6a2.2 2.2 0 0 1-2.2-2.2V7.2A2.2 2.2 0 0 1 6 5Zm3.7 8.2 1.4 1.4 3.3-3.4 1.4 1.4-4.7 4.8-2.8-2.8 1.4-1.4Z"
        />
      ) : (
        <>
          <rect x="3.8" y="5" width="16.4" height="16" rx="2.2" />
          <path d="m9 13.9 2.1 2.1 4-4.1" />
        </>
      )}
      <path d="M8 3.1v3.2M16 3.1v3.2" stroke="currentColor" strokeWidth={1.8} />
    </Svg>
  );
}

export function ProfileGlyph({ filled = false, className }: NavGlyphProps) {
  return (
    <Svg filled={filled} className={className}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M12 14.4c-3.7 0-6.6 2.3-6.9 5.3-.1.5.3.9.8.9h12.2c.5 0 .9-.4.8-.9-.3-3-3.2-5.3-6.9-5.3Z" />
    </Svg>
  );
}
