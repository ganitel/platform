import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronLeft,
  Share2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { usePropertyWishlistToggle } from "@/hooks";
import type { ServiceListItem } from "@shared/api";

interface PropertyImageGalleryProps {
  images: string[];
  property: ServiceListItem;
}

export function PropertyImageGallery({ images, property }: PropertyImageGalleryProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const { isFavorited, toggle } = usePropertyWishlistToggle(property);

  // Use the Carousel API to track the current slide for the counter
  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setActiveIndex(api.selectedScrollSnap());
    });
  }, [api]);

  // Handle keyboard navigation manually to ensure it works even if focus is lost
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !api) return;

      if (e.key === "ArrowLeft") {
        api.scrollPrev();
      } else if (e.key === "ArrowRight") {
        api.scrollNext();
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, api]);

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: "Ganitel Property",
        text: `Check out this amazing property: ${property.title}`,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard", {
        description: "You can now paste it anywhere.",
        duration: 2000,
      });
    }
  };

  return (
    <section className="w-full relative">
      {/* Mobile View: Single Image/Hero */}
      <div className="md:hidden relative w-full h-[238px]">
        <img
          src={images[0]}
          alt="Property Main"
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => openLightbox(0)}
        />

        {/* Top Action Buttons - Mobile */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center bg-black/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center bg-black/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-transform"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleToggleWishlist}
              className="w-10 h-10 flex items-center justify-center bg-black/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-transform group"
            >
              <img
                src="/icons/heart.svg"
                alt="Favorite"
                className={cn("w-5 h-5 transition-all duration-300", isFavorited ? "scale-110" : "opacity-60")}
                style={{
                  filter: isFavorited ? 'invert(15%) sepia(95%) saturate(6932%) hue-rotate(358deg) brightness(95%) contrast(112%)' : 'none'
                }}
              />
            </button>
          </div>
        </div>

        {/* Photos count button - Mobile */}
        <button
          onClick={() => openLightbox(0)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-md active:scale-95 transition-transform"
        >
          <ImageIcon className="w-4 h-4 text-ganitel-text-title" />
          <span className="text-xs font-semibold text-black">
            {images.length} photos
          </span>
        </button>
      </div>

      {/* Desktop View: Grid Layout */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[450px] rounded-2xl overflow-hidden mt-6 mx-4 relative group">
        {/* Main Image */}
        <div className="col-span-2 row-span-2 relative overflow-hidden cursor-pointer">
          <img
            src={images[0]}
            alt="Property Hero"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            onClick={() => openLightbox(0)}
          />
          {/* Wishlist Button - Desktop Main */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all active:scale-95"
          >
            <img
              src="/icons/heart.svg"
              alt="Favorite"
              className={cn("w-5 h-5 transition-all duration-300", isFavorited ? "scale-110" : "opacity-60")}
              style={{
                filter: isFavorited ? 'invert(15%) sepia(95%) saturate(6932%) hue-rotate(358deg) brightness(95%) contrast(112%)' : 'none'
              }}
            />
          </button>
        </div>

        {/* Smaller Images */}
        {images.slice(1, 5).map((img, idx) => (
          <div key={idx} className="relative overflow-hidden cursor-pointer">
            <img
              src={img}
              alt={`Property image ${idx + 2}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              onClick={() => openLightbox(idx + 1)}
            />
            {/* Overlay if it's the last slot and there are more images */}
            {idx === 3 && images.length > 5 && (
              <div
                className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none"
              >
                <span className="text-white text-lg font-bold">+{images.length - 5}</span>
              </div>
            )}
          </div>
        ))}

        {/* Show all button - Desktop */}
        <button
          onClick={() => openLightbox(0)}
          className="absolute bottom-5 right-5 inline-flex items-center gap-2 px-4 py-2 bg-white border border-ganitel-neutral-3 rounded-xl hover:bg-ganitel-neutral-2 transition-colors z-10 shadow-sm font-medium text-sm"
        >
          <ImageIcon className="w-4 h-4" />
          Show all photos
        </button>
      </div>

      {/* Lightbox / Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-[100vw] h-screen w-full bg-black/98 p-0 border-none sm:rounded-none flex items-center justify-center outline-none"
        >
          {/* Custom Close Button */}
          <DialogClose className="absolute top-6 right-6 z-[60] text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all ring-offset-black focus:outline-none focus:ring-2 focus:ring-white">
            <X className="w-6 h-6" />
            <span className="sr-only">Close gallery</span>
          </DialogClose>

          <Carousel
            setApi={setApi}
            className="w-full h-full flex items-center justify-center"
            opts={{
              startIndex: activeIndex,
              loop: true,
            }}
          >
            <CarouselContent className="h-full ml-0">
              {images.map((img, index) => (
                <CarouselItem key={index} className="pl-0 h-full flex items-center justify-center p-4 md:p-12">
                  <div className="relative w-full max-w-5xl aspect-video md:aspect-[16/10] overflow-hidden rounded-xl shadow-2xl select-none animate-in fade-in zoom-in duration-300">
                    <img
                      src={img}
                      alt={`Property full view ${index + 1}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <CarouselPrevious className="left-8 w-12 h-12 bg-white/10 border-none text-white hover:bg-white/20 transition-colors" />
              <CarouselNext className="right-8 w-12 h-12 bg-white/10 border-none text-white hover:bg-white/20 transition-colors" />
            </div>

            {/* Counter UI */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/90">
              <span className="text-sm font-medium tracking-wide">
                {activeIndex + 1} / {images.length}
              </span>
              <div className="flex gap-1.5 mt-2">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      activeIndex === i ? "bg-white w-4" : "bg-white/30"
                    )}
                  />
                ))}
              </div>
            </div>
          </Carousel>
        </DialogContent>
      </Dialog>
    </section>
  );
}
