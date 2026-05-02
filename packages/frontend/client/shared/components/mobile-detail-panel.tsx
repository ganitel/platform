import { useState } from "react";
import type { ReactNode } from "react";

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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ganitel-stroke-neutral bg-ganitel-paper lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-infoma text-lg leading-tight text-ganitel-text-title">
            {priceText}
          </p>
          <p className="text-xs text-ganitel-text-subtitle">{priceLabel}</p>
        </div>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="shrink-0 rounded-xl bg-ganitel-primary px-7 py-3 text-sm font-semibold text-white transition-opacity active:opacity-80"
            >
              {ctaLabel}
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[90svh] overflow-y-auto bg-ganitel-paper">
            {drawerTitle && (
              <DrawerHeader className="border-b border-ganitel-stroke-neutral text-left">
                <DrawerTitle className="font-display text-ganitel-text-title">
                  {drawerTitle}
                </DrawerTitle>
              </DrawerHeader>
            )}
            <div
              className="px-4 pb-8 pt-4"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 32px)" }}
            >
              {children}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
