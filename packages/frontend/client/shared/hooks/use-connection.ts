import { useEffect, useState } from "react";

/**
 * Signals we use to dial visual richness down on low-end mobile:
 *   - prefers-reduced-motion: a11y opt-out for animation.
 *   - Network Information API `saveData` or 2G/3G effectiveType: many
 *     African users are on metered/spotty links; serve calmer UI.
 *
 * Server render returns "calm" (no animation, treat as save-data) so the
 * first paint never starts an animation. The client re-evaluates on mount.
 */

interface ConnectionLike {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

function getNavigatorConnection(): ConnectionLike | undefined {
  if (typeof navigator === "undefined") return undefined;
  const nav = navigator as Navigator & {
    connection?: ConnectionLike;
    mozConnection?: ConnectionLike;
    webkitConnection?: ConnectionLike;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

/** Recomputes the calm signal from the live browser; only safe in an effect. */
function readBrowserCalm(): boolean {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const conn = getNavigatorConnection();
  const saveData = Boolean(conn?.saveData);
  const slow =
    conn?.effectiveType === "slow-2g" ||
    conn?.effectiveType === "2g" ||
    conn?.effectiveType === "3g";
  return reducedMotion || saveData || slow;
}

export function useCalmMode(): boolean {
  // Hydration safety: SSR renders with calm=true (no animation). The client's
  // first render must match that, then we upgrade to the real browser state
  // inside an effect.
  const [calm, setCalm] = useState(true);

  useEffect(() => {
    const sync = () => setCalm(readBrowserCalm());
    sync();
    const motionMql = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionMql.addEventListener("change", sync);
    const conn = getNavigatorConnection();
    conn?.addEventListener?.("change", sync);
    return () => {
      motionMql.removeEventListener("change", sync);
      conn?.removeEventListener?.("change", sync);
    };
  }, []);

  return calm;
}
