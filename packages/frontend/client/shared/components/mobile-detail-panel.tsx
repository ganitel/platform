import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronUp } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";

interface Props {
  priceText: string;
  priceLabel: string;
  ctaLabel: string;
  drawerTitle?: string;
  children: ReactNode;
}

export function MobileDetailPanel({
  priceText,
  priceLabel,
  ctaLabel,
  drawerTitle,
  children,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ganitel-stroke-neutral bg-ganitel-paper/95 backdrop-blur shadow-[0_-12px_24px_-12px_rgba(20,16,12,0.18)] supports-[backdrop-filter]:bg-ganitel-paper/85 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="min-w-0 leading-tight">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ganitel-text-placeholder">
            {priceLabel}
          </p>
          <p className="truncate text-[20px] font-semibold tracking-tight text-ganitel-text-title">
            {priceText}
          </p>
        </div>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ganitel-text-title px-5 py-3 text-sm font-semibold text-ganitel-paper transition-transform active:scale-[0.97]"
            >
              {ctaLabel}
              <ChevronUp className="size-4" aria-hidden strokeWidth={2.2} />
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[92svh] overflow-y-auto bg-ganitel-paper">
            {drawerTitle && (
              <DrawerHeader className="border-b border-ganitel-stroke-neutral text-left">
                <DrawerTitle className="font-semibold tracking-tight text-ganitel-text-title">
                  {drawerTitle}
                </DrawerTitle>
              </DrawerHeader>
            )}
            <div
              className="px-4 pb-8 pt-4"
              style={{
                paddingBottom: "max(env(safe-area-inset-bottom, 0px), 32px)",
              }}
            >
              {children}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
