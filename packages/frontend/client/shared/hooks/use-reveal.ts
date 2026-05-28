import { useEffect, useRef } from "react";

export interface UseRevealOptions {
  rootMargin?: string;
  threshold?: number;
}

export function useReveal<T extends HTMLElement = HTMLElement>(
  options: UseRevealOptions = {},
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      node.setAttribute("data-reveal", "visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).setAttribute(
              "data-reveal",
              "visible",
            );
            observer.unobserve(entry.target);
          }
        }
      },
      {
        rootMargin: options.rootMargin ?? "-10% 0px -10% 0px",
        threshold: options.threshold ?? 0,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold]);

  return ref;
}
