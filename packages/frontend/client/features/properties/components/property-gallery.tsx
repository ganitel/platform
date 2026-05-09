import { useCallback, useRef, useState } from "react";
import { Camera } from "lucide-react";

import type { MediaPublic } from "@/features/properties/types";

interface Props {
  photos: MediaPublic[];
  title: string;
}

export function PropertyGallery({ photos, title }: Props) {
  if (photos.length === 0) {
    return (
      <div className="aspect-[16/9] w-full rounded-3xl bg-ganitel-background-neutral2" />
    );
  }

  const [hero, ...rest] = photos;
  const grid = rest.slice(0, 4);

  return (
    <>
      <MobileGallery photos={photos} title={title} />

      <div className="hidden overflow-hidden rounded-3xl sm:grid sm:grid-cols-4 sm:gap-2">
        <img
          src={hero.url}
          alt={hero.alt ?? title}
          className="col-span-2 row-span-2 aspect-auto w-full object-cover"
        />
        {grid.map((m) => (
          <img
            key={m.id}
            src={m.url}
            alt={m.alt ?? title}
            loading="lazy"
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
    <div className="relative sm:hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto rounded-3xl"
      >
        {photos.map((m, i) => (
          <div key={m.id ?? i} className="w-full shrink-0 snap-start">
            <img
              src={m.url}
              alt={m.alt ?? title}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
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
