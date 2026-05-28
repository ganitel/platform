import { useCallback, useRef } from "react";

export interface UseRevealOptions {
  rootMargin?: string;
  threshold?: number;
}

export function useReveal<T extends HTMLElement = HTMLElement>(
  options: UseRevealOptions = {},
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const rootMargin = options.rootMargin ?? "-10% 0px -10% 0px";
  const threshold = options.threshold ?? 0;

  return useCallback(
    (node: T | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
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
        { rootMargin, threshold },
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [rootMargin, threshold],
  );
}
