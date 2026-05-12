import { useEffect, useState } from "react";
import { useNavigation } from "react-router";

const SHOW_DELAY_MS = 120;

export function NavigationProgress() {
  const navigation = useNavigation();
  const active = navigation.state !== "idle";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      setVisible(false);
    };
  }, [active]);

  return (
    <div
      aria-hidden
      className={
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] overflow-hidden transition-opacity duration-150 " +
        (visible ? "opacity-100" : "opacity-0")
      }
    >
      <div className="nav-progress-bar h-full w-1/3 bg-ganitel-secondary" />
      <style>{`
        @keyframes nav-progress-slide {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(150%); }
          100% { transform: translateX(400%); }
        }
        .nav-progress-bar {
          animation: nav-progress-slide 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
