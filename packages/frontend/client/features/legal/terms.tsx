import { Markdown } from "@/shared/components/markdown";
import { useT } from "@/shared/lib/i18n";
import { useReveal } from "@/shared/hooks/use-reveal";
import { SectionHeader } from "@/shared/ui/section-header";

import { LegalFooterNotes } from "./legal-shell";

export function Terms() {
  const t = useT();
  const ref = useReveal<HTMLDivElement>();
  return (
    <>
      <section className="px-6 pb-8 pt-16 md:px-12 md:pb-12 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            level="h1"
            align="stacked"
            tag={t("terms.tag")}
            title={t("terms.title")}
            emphasis={t("terms.title_em")}
            lede={t("terms.lede")}
          />
        </div>
      </section>

      <section className="px-6 pb-16 md:px-12 md:pb-20">
        <div ref={ref} data-reveal="" className="mx-auto max-w-3xl">
          <LegalFooterNotes className="mb-10" />
          <Markdown source={t("terms.body")} />
          <LegalFooterNotes className="mt-12" showNotice={false} showContact />
        </div>
      </section>
    </>
  );
}
