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
    <div className="grid grid-cols-4 gap-2 overflow-hidden rounded-3xl">
      <img
        src={hero.url}
        alt={hero.alt ?? title}
        className="col-span-4 aspect-[16/9] w-full object-cover sm:col-span-2 sm:row-span-2 sm:aspect-auto"
      />
      {grid.map((m) => (
        <img
          key={m.id}
          src={m.url}
          alt={m.alt ?? title}
          loading="lazy"
          className="hidden aspect-square w-full object-cover sm:block"
        />
      ))}
    </div>
  );
}
