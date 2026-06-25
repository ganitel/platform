import { Compass } from "lucide-react";

interface Props {
  label: string;
}

/**
 * Rotating circular "stamp" — the hero's signature detail. Text follows a
 * circular path around a compass mark; rotation pauses under reduced motion.
 */
export function HeroSeal({ label }: Props) {
  const repeated = `${label}${label}`;
  return (
    <div className="relative grid size-24 place-items-center rounded-full bg-ganitel-surface-card/95 shadow-[0_10px_30px_-10px_rgba(24,16,12,0.35)] backdrop-blur md:size-28">
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full animate-[spin_22s_linear_infinite] text-ganitel-olive motion-reduce:animate-none"
        aria-hidden
      >
        <defs>
          <path
            id="hero-seal-path"
            d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
            fill="none"
          />
        </defs>
        <text className="fill-current text-[8.2px] font-semibold uppercase tracking-[0.14em]">
          <textPath href="#hero-seal-path" startOffset="0">
            {repeated}
          </textPath>
        </text>
      </svg>
      <Compass
        className="size-6 text-ganitel-olive md:size-7"
        strokeWidth={1.6}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
