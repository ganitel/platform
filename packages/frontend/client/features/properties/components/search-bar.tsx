import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { useT } from "@/shared/lib/i18n";

interface Props {
  initialQuery?: string;
  onSubmit: (q: string) => void;
}

export function SearchBar({ initialQuery = "", onSubmit }: Props) {
  const t = useT();
  const [q, setQ] = useState(initialQuery);

  const handle = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(q.trim());
  };

  return (
    <form onSubmit={handle} role="search" className="flex gap-2">
      <div className="relative flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ganitel-text-placeholder"
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("common.search")}
          className="h-12 rounded-full border-ganitel-stroke-neutral bg-ganitel-background-neutral1 pl-10 pr-4"
        />
      </div>
      <Button
        type="submit"
        className="h-12 rounded-full bg-ganitel-primary px-6 text-ganitel-text-button hover:bg-ganitel-primary/90"
      >
        {t("common.search")}
      </Button>
    </form>
  );
}
