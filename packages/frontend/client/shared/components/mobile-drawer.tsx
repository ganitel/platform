import type { ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { X } from "lucide-react";

export interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children: ReactNode;
}

export function MobileDrawer({
  open,
  onOpenChange,
  title,
  children,
}: MobileDrawerProps) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="left"
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-40 bg-[var(--color-ganitel-overlay-warm)] backdrop-blur-[2px]" />
        <DrawerPrimitive.Content
          className="fixed inset-y-0 left-0 z-50 flex h-full w-[85vw] max-w-sm flex-col bg-ganitel-paper p-6 outline-none"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
        >
          <header className="flex items-center justify-between">
            <DrawerPrimitive.Title
              className="text-[22px] leading-none tracking-[-0.01em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </DrawerPrimitive.Title>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => onOpenChange(false)}
              className="rounded-full p-2 text-ganitel-text-subtitle transition-colors hover:bg-ganitel-stroke-neutral/40 hover:text-ganitel-text-title"
            >
              <X className="size-5" strokeWidth={1.7} />
            </button>
          </header>
          <div className="mt-6 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            {children}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
