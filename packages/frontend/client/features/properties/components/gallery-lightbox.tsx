import { type MouseEvent, useCallback, useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { MediaPublic } from "@/features/properties/types";
import { buildSrcSet, transformImage } from "@/shared/lib/image";
import { useT } from "@/shared/lib/i18n";

const LIGHTBOX_WIDTHS = [960, 1280, 1600, 2000] as const;

interface Props {
  photos: MediaPublic[];
  title: string;
  open: boolean;
  startIndex: number;
  onOpenChange: (open: boolean) => void;
}

export function GalleryLightbox({
  photos,
  title,
  open,
  startIndex,
  onOpenChange,
}: Props) {
  const t = useT();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex,
    loop: photos.length > 1,
  });
  const [selected, setSelected] = useState(startIndex);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (open && emblaApi) emblaApi.scrollTo(startIndex, true);
  }, [open, startIndex, emblaApi]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") scrollPrev();
      else if (event.key === "ArrowRight") scrollNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, scrollPrev, scrollNext]);

  const hasMultiple = photos.length > 1;

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest("[data-lightbox-media]") || target.closest("button")) {
        return;
      }
      onOpenChange(false);
    },
    [onOpenChange],
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={handleBackdropClick}
        >
          <DialogPrimitive.Title className="sr-only">
            {title}
          </DialogPrimitive.Title>

          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium tabular-nums">
              {hasMultiple ? `${selected + 1} / ${photos.length}` : ""}
            </span>
            <DialogPrimitive.Close
              className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label={t("gallery.close")}
              onClick={(event) => event.stopPropagation()}
            >
              <X className="size-6" />
            </DialogPrimitive.Close>
          </div>

          <div className="relative min-h-0 flex-1">
            <div className="h-full overflow-hidden" ref={emblaRef}>
              <div className="flex h-full">
                {photos.map((media, index) => (
                  <div
                    key={media.id ?? index}
                    className="flex h-full min-w-0 shrink-0 grow-0 basis-full items-center justify-center px-4 pb-6"
                  >
                    <LightboxMedia media={media} title={title} />
                  </div>
                ))}
              </div>
            </div>

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    scrollPrev();
                  }}
                  aria-label={t("gallery.previous")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-6"
                >
                  <ChevronLeft className="size-7" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    scrollNext();
                  }}
                  aria-label={t("gallery.next")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-6"
                >
                  <ChevronRight className="size-7" />
                </button>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function LightboxMedia({
  media,
  title,
}: {
  media: MediaPublic;
  title: string;
}) {
  if (media.kind === "video") {
    return (
      <video
        controls
        preload="metadata"
        poster={media.poster_url ?? undefined}
        data-lightbox-media
        className="max-h-full max-w-full object-contain"
      >
        <source src={media.url} type={media.mime_type} />
        <track kind="captions" />
      </video>
    );
  }
  return (
    <img
      src={transformImage(media.url, { width: 1600, quality: 82 })}
      srcSet={buildSrcSet(media.url, LIGHTBOX_WIDTHS, 82)}
      sizes="100vw"
      alt={title}
      decoding="async"
      data-lightbox-media
      className="max-h-full max-w-full object-contain"
    />
  );
}
