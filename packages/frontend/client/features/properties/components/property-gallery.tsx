import { useCallback, useRef, useState } from "react";
import { Camera } from "lucide-react";

import type { MediaPublic } from "@/features/properties/types";
import { GalleryLightbox } from "@/features/properties/components/gallery-lightbox";
import { buildSrcSet, transformImage } from "@/shared/lib/image";
import { useT } from "@/shared/lib/i18n";

interface Props {
  photos: MediaPublic[];
  title: string;
}

const DESKTOP_HERO_WIDTHS = [600, 900, 1200] as const;
const DESKTOP_TILE_WIDTHS = [300, 450, 600] as const;

// Network Information API isn't typed in lib.dom; widen `navigator` locally.
function isSlowNetwork(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (
    navigator as Navigator & { connection?: { effectiveType?: string } }
  ).connection;
  const et = conn?.effectiveType;
  return et === "2g" || et === "slow-2g";
}

export function PropertyGallery({ photos, title }: Props) {
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const openAt = useCallback(
    (index: number) => setLightbox({ open: true, index }),
    [],
  );

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
      <MobileGallery photos={photos} title={title} onOpen={openAt} />

      <div className="hidden overflow-hidden rounded-3xl sm:grid sm:grid-cols-4 sm:gap-2">
        <HeroTile
          media={hero}
          title={title}
          total={total}
          onOpen={() => openAt(0)}
        />
        {grid.map((m, i) => (
          <GridTile
            key={m.id}
            media={m}
            index={i}
            total={total}
            title={title}
            onOpen={() => openAt(i + 1)}
          />
        ))}
      </div>

      <GalleryLightbox
        photos={photos}
        title={title}
        open={lightbox.open}
        startIndex={lightbox.index}
        onOpenChange={(open) => setLightbox((prev) => ({ ...prev, open }))}
      />
    </>
  );
}

function HeroTile({
  media,
  title,
  total,
  onOpen,
}: {
  media: MediaPublic;
  title: string;
  total: number;
  onOpen: () => void;
}) {
  const t = useT();
  if (media.kind === "video" && !isSlowNetwork()) {
    return (
      <video
        controls
        preload="none"
        poster={media.poster_url ?? undefined}
        className="col-span-2 row-span-2 aspect-square w-full object-cover"
      >
        <source src={media.url} type={media.mime_type} />
        <track kind="captions" />
      </video>
    );
  }
  const stillUrl =
    media.kind === "video" ? (media.poster_url ?? media.url) : media.url;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("gallery.view")}
      className="col-span-2 row-span-2 cursor-zoom-in"
    >
      <img
        src={transformImage(stillUrl, { width: 1200, quality: 78 })}
        srcSet={
          media.kind === "image"
            ? buildSrcSet(stillUrl, DESKTOP_HERO_WIDTHS, 78)
            : undefined
        }
        sizes="(min-width: 1024px) 600px, 50vw"
        alt={total > 1 ? `${title} — 1/${total}` : title}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        width={1200}
        height={1200}
        className="aspect-square w-full object-cover"
      />
    </button>
  );
}

function GridTile({
  media,
  index,
  total,
  title,
  onOpen,
}: {
  media: MediaPublic;
  index: number;
  total: number;
  title: string;
  onOpen: () => void;
}) {
  const t = useT();
  if (media.kind === "video" && !isSlowNetwork()) {
    return (
      <video
        controls
        preload="none"
        poster={media.poster_url ?? undefined}
        className="aspect-square w-full object-cover"
      >
        <source src={media.url} type={media.mime_type} />
        <track kind="captions" />
      </video>
    );
  }
  const stillUrl =
    media.kind === "video" ? (media.poster_url ?? media.url) : media.url;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("gallery.view")}
      className="cursor-zoom-in"
    >
      <img
        src={transformImage(stillUrl, { width: 600, quality: 75 })}
        srcSet={
          media.kind === "image"
            ? buildSrcSet(stillUrl, DESKTOP_TILE_WIDTHS, 75)
            : undefined
        }
        sizes="(min-width: 1024px) 300px, 25vw"
        alt={`${title} — ${index + 2}/${total}`}
        loading="lazy"
        decoding="async"
        width={600}
        height={600}
        className="aspect-square w-full object-cover"
      />
    </button>
  );
}

function MobileGallery({
  photos,
  title,
  onOpen,
}: {
  photos: MediaPublic[];
  title: string;
  onOpen: (index: number) => void;
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
            <MobileTile
              media={m}
              index={i}
              total={photos.length}
              title={title}
              onOpen={() => onOpen(i)}
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

function MobileTile({
  media,
  index,
  total,
  title,
  onOpen,
}: {
  media: MediaPublic;
  index: number;
  total: number;
  title: string;
  onOpen: () => void;
}) {
  const t = useT();
  if (media.kind === "video" && !isSlowNetwork()) {
    return (
      <video
        controls
        preload="none"
        poster={media.poster_url ?? undefined}
        className="aspect-[4/3] w-full object-cover"
      >
        <source src={media.url} type={media.mime_type} />
        <track kind="captions" />
      </video>
    );
  }
  const stillUrl =
    media.kind === "video" ? (media.poster_url ?? media.url) : media.url;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("gallery.view")}
      className="block w-full"
    >
      <img
        src={transformImage(stillUrl, { width: 800, quality: 75 })}
        srcSet={
          media.kind === "image"
            ? buildSrcSet(stillUrl, [480, 720, 960], 75)
            : undefined
        }
        sizes="100vw"
        alt={total > 1 ? `${title} — ${index + 1}/${total}` : title}
        loading={index === 0 ? "eager" : "lazy"}
        fetchPriority={index === 0 ? "high" : "auto"}
        decoding="async"
        width={800}
        height={600}
        className="aspect-[4/3] w-full object-cover"
      />
    </button>
  );
}
