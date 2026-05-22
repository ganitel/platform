import { motion } from "framer-motion";

import { Markdown } from "@/shared/components/markdown";
import { useT } from "@/shared/lib/i18n";
import { SectionHeader } from "@/shared/ui/section-header";

import { LegalFooterNotes } from "./legal-shell";

const ENTRANCE_EASE = [0.2, 0.7, 0.2, 1] as const;

export function Terms() {
  const t = useT();
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
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, ease: ENTRANCE_EASE }}
          className="mx-auto max-w-3xl"
        >
          <LegalFooterNotes className="mb-10" />
          <Markdown source={t("terms.body")} />
          <LegalFooterNotes className="mt-12" showContact />
        </motion.div>
      </section>
    </>
  );
}
