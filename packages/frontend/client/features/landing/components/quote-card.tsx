import { Quote } from "lucide-react";

interface Props {
  body: string;
  name: string;
  place: string;
}

export function QuoteCard({ body, name, place }: Props) {
  return (
    <figure className="flex w-[300px] shrink-0 snap-start flex-col justify-between gap-6 rounded-card border border-ganitel-outline-soft/50 bg-ganitel-surface-card p-7 md:w-[360px]">
      <Quote className="size-7 text-ganitel-accent" aria-hidden />
      <blockquote className="text-pretty text-lg italic leading-relaxed text-ganitel-text-title">
        {body}
      </blockquote>
      <figcaption className="not-italic">
        <span className="block text-sm font-semibold text-ganitel-text-title">
          {name}
        </span>
        <span className="text-[13px] text-ganitel-text-placeholder">
          {place}
        </span>
      </figcaption>
    </figure>
  );
}
