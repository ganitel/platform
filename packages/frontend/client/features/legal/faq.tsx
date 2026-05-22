import { motion } from "framer-motion";

import { useT } from "@/shared/lib/i18n";
import { SectionHeader } from "@/shared/ui/section-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";

import { FAQ_ITEMS } from "./faq-items";

const ENTRANCE_EASE = [0.2, 0.7, 0.2, 1] as const;

export function Faq() {
  const t = useT();
  const email = t("legal.contact_email");

  return (
    <>
      <section className="px-6 pb-8 pt-16 md:px-12 md:pb-12 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            level="h1"
            align="stacked"
            tag={t("faq.tag")}
            title={t("faq.title")}
            emphasis={t("faq.title_em")}
            lede={t("faq.lede")}
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
          <Accordion
            type="single"
            collapsible
            className="border-t border-ganitel-stroke-neutral"
          >
            {FAQ_ITEMS.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-ganitel-stroke-neutral"
              >
                <AccordionTrigger className="font-display text-left text-base font-bold tracking-[-0.02em] text-ganitel-text-title md:text-lg">
                  {t(item.questionKey)}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] leading-[1.7] text-ganitel-text-subtitle md:text-base">
                  {t(item.answerKey)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <p className="mt-12 text-sm leading-[1.7] text-ganitel-text-subtitle">
            {t("faq.still_need_help")}{" "}
            <a
              href={`mailto:${email}`}
              className="text-ganitel-text-title underline decoration-dotted underline-offset-4 hover:decoration-solid"
            >
              {email}
            </a>
          </p>
        </motion.div>
      </section>
    </>
  );
}
