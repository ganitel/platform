import { Link } from "react-router";

import { buildSrcSet, transformImage } from "@/shared/lib/image";
import { fallbackOnError } from "@/shared/lib/image";

interface Props {
  name: string;
  href: string;
  source: string;
  fallback: string;
  alt: string;
}

const CITY_SIZES = "200px";

export function CityCard({ name, href, source, fallback, alt }: Props) {
  return (
    <Link
      to={href}
      className="group relative h-[180px] w-[150px] shrink-0 snap-start overflow-hidden rounded-card"
    >
      <img
        src={transformImage(source, { width: 360, quality: 70 })}
        srcSet={buildSrcSet(source, [200, 360, 480], 70)}
        sizes={CITY_SIZES}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={300}
        height={360}
        onError={fallbackOnError(fallback)}
        className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"
      />
      <span className="absolute bottom-3 left-3 text-base font-semibold tracking-tight text-white drop-shadow">
        {name}
      </span>
    </Link>
  );
}
