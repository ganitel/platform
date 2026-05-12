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

function readSnapshot(): {
  calm: boolean;
  saveData: boolean;
  reducedMotion: boolean;
} {
  if (typeof window === "undefined") {
    return { calm: true, saveData: true, reducedMotion: true };
  }
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const conn = getNavigatorConnection();
  const saveData = Boolean(conn?.saveData);
  const slow =
    conn?.effectiveType === "slow-2g" ||
    conn?.effectiveType === "2g" ||
    conn?.effectiveType === "3g";
  return {
    calm: reducedMotion || saveData || slow,
    saveData,
    reducedMotion,
  };
}

export function useCalmMode(): boolean {
  const [snap, setSnap] = useState(readSnapshot);

  useEffect(() => {
    const onChange = () => setSnap(readSnapshot());
    const motionMql = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionMql.addEventListener("change", onChange);
    const conn = getNavigatorConnection();
    conn?.addEventListener?.("change", onChange);
    return () => {
      motionMql.removeEventListener("change", onChange);
      conn?.removeEventListener?.("change", onChange);
    };
  }, []);

  return snap.calm;
}
