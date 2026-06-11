import { Globe } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useLocale, useSetLocale, useT, type Locale } from "@/shared/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

const OPTIONS: { value: Locale; labelKey: "lang.name.fr" | "lang.name.en" }[] =
  [
    { value: "fr", labelKey: "lang.name.fr" },
    { value: "en", labelKey: "lang.name.en" },
  ];

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useT();
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.language")}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-ganitel-text-subtitle transition-colors hover:bg-ganitel-stroke-neutral/40 hover:text-ganitel-text-title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ganitel-primary",
            className,
          )}
        >
          <Globe className="size-4" strokeWidth={1.7} />
          <span className="uppercase">{locale}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => setLocale(value as Locale)}
        >
          {OPTIONS.map(({ value, labelKey }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {t(labelKey)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
