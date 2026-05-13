import { useCallback, useRef, useState } from "react";
import { Camera } from "lucide-react";

import type { MediaPublic } from "@/features/properties/types";
import { buildSrcSet, transformImage } from "@/shared/lib/image";

interface Props {
  photos: MediaPublic[];
  title: string;
}

const DESKTOP_HERO_WIDTHS = [600, 900, 1200] as const;
const DESKTOP_TILE_WIDTHS = [300, 450, 600] as const;

export function PropertyGallery({ photos, title }: Props) {
  if (photos.length === 0) {
    return (
      <div className="aspect-[16/9] w-full rounded-3xl bg-ganitel-background-neutral2" />
    );
  }

  const [hero, ...rest] = photos;
  const grid = rest.slice(0, 4);
  const total = photos.length;

  return (
    <>
      <MobileGallery photos={photos} title={title} />

      <div className="hidden overflow-hidden rounded-3xl sm:grid sm:grid-cols-4 sm:gap-2">
        <img
          src={transformImage(hero.url, { width: 1200, quality: 78 })}
          srcSet={buildSrcSet(hero.url, DESKTOP_HERO_WIDTHS, 78)}
          sizes="(min-width: 1024px) 600px, 50vw"
          alt={total > 1 ? `${title} — 1/${total}` : title}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width={1200}
          height={800}
          className="col-span-2 row-span-2 aspect-auto w-full object-cover"
        />
        {grid.map((m, i) => (
          <img
            key={m.id}
            src={transformImage(m.url, { width: 600, quality: 75 })}
            srcSet={buildSrcSet(m.url, DESKTOP_TILE_WIDTHS, 75)}
            sizes="(min-width: 1024px) 300px, 25vw"
            alt={`${title} — ${i + 2}/${total}`}
            loading="lazy"
            decoding="async"
            width={600}
            height={600}
            className="aspect-square w-full object-cover"
          />
        ))}
      </div>
    </>
  );
}

function MobileGallery({
  photos,
  title,
}: {
  photos: MediaPublic[];
  title: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setCurrent(Math.min(index, photos.length - 1));
  }, [photos.length]);

  return (
    <div className="relative -mx-4 sm:hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
      >
        {photos.map((m, i) => (
          <div key={m.id ?? i} className="w-full shrink-0 snap-start">
            <img
              src={transformImage(m.url, { width: 800, quality: 75 })}
              srcSet={buildSrcSet(m.url, [480, 720, 960], 75)}
              sizes="100vw"
              alt={
                photos.length > 1
                  ? `${title} — ${i + 1}/${photos.length}`
                  : title
              }
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              decoding="async"
              width={800}
              height={600}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          <Camera className="size-3" aria-hidden />
          <span aria-live="polite" aria-atomic="true">
            {current + 1} / {photos.length}
          </span>
        </div>
      )}

      {photos.length > 1 && photos.length <= 8 && (
        <div
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1"
          aria-hidden
        >
          {photos.map((_, i) => (
            <span
              key={i}
              className={
                i === current
                  ? "size-1.5 rounded-full bg-white"
                  : "size-1.5 rounded-full bg-white/50"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
