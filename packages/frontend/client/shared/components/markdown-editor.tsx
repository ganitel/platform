import { useId, useState } from "react";

import { Markdown } from "@/shared/components/markdown";
import { cn } from "@/shared/lib/cn";
import { useT } from "@/shared/lib/i18n";

interface MarkdownEditorProps {
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  maxLength?: number;
  className?: string;
  textareaClassName?: string;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  rows = 8,
  maxLength = 10000,
  className,
  textareaClassName,
  placeholder,
}: MarkdownEditorProps) {
  const t = useT();
  const [mode, setMode] = useState<"write" | "preview">("write");
  const id = useId();
  const writeId = `${id}-write`;
  const previewId = `${id}-preview`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="tablist"
        aria-label={t("markdown.editor.tabs_label")}
        className="inline-flex w-fit gap-1 rounded-full border border-ganitel-stroke-neutral bg-ganitel-neutral-2 p-1"
      >
        <TabButton
          id={`${writeId}-tab`}
          controls={writeId}
          active={mode === "write"}
          onClick={() => setMode("write")}
        >
          {t("markdown.editor.write")}
        </TabButton>
        <TabButton
          id={`${previewId}-tab`}
          controls={previewId}
          active={mode === "preview"}
          onClick={() => setMode("preview")}
        >
          {t("markdown.editor.preview")}
        </TabButton>
      </div>

      {mode === "write" ? (
        <div
          role="tabpanel"
          id={writeId}
          aria-labelledby={`${writeId}-tab`}
          className="flex flex-col gap-1.5"
        >
          <textarea
            rows={rows}
            maxLength={maxLength}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full rounded-xl border border-ganitel-stroke-neutral bg-white px-3 py-2 font-mono text-sm leading-relaxed text-ganitel-text-title shadow-sm focus:border-ganitel-secondary focus:outline-none focus:ring-2 focus:ring-ganitel-secondary/30",
              textareaClassName,
            )}
          />
          <p className="text-xs text-ganitel-text-placeholder">
            {t("markdown.editor.hint")}
          </p>
        </div>
      ) : (
        <div
          role="tabpanel"
          id={previewId}
          aria-labelledby={`${previewId}-tab`}
          className="min-h-[8rem] rounded-xl border border-ganitel-stroke-neutral bg-white px-4 py-3 text-sm shadow-sm"
        >
          {value.trim() ? (
            <Markdown source={value} />
          ) : (
            <p className="text-sm italic text-ganitel-text-placeholder">
              {t("markdown.editor.empty_preview")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  id,
  controls,
  active,
  onClick,
  children,
}: {
  id: string;
  controls: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      type="button"
      id={id}
      aria-controls={controls}
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] transition",
        active
          ? "bg-white text-ganitel-text-title shadow-sm"
          : "text-ganitel-text-subtitle hover:text-ganitel-text-title",
      )}
    >
      {children}
    </button>
  );
}
