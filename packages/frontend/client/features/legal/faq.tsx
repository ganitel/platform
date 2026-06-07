import { useT } from "@/shared/lib/i18n";
import { useReveal } from "@/shared/hooks/use-reveal";
import { SectionHeader } from "@/shared/ui/section-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";

import { FAQ_CATEGORIES, FAQ_ITEMS } from "./faq-items";

export function Faq() {
  const t = useT();
  const email = t("legal.contact_email");
  const ref = useReveal<HTMLDivElement>();

  const sections = FAQ_CATEGORIES.map((category) => ({
    ...category,
    items: FAQ_ITEMS.filter((item) => item.category === category.id),
  })).filter((section) => section.items.length > 0);

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
        <div ref={ref} data-reveal="" className="mx-auto max-w-3xl">
          {sections.map((section) => (
            <div key={section.id} className="mb-12 last:mb-0">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-ganitel-secondary">
                {t(section.labelKey)}
              </h2>
              <Accordion
                type="single"
                collapsible
                className="border-t border-ganitel-stroke-neutral"
              >
                {section.items.map((item) => (
                  <AccordionItem
                    key={item.id}
                    value={item.id}
                    className="border-ganitel-stroke-neutral"
                  >
                    <AccordionTrigger className="text-left text-base font-bold tracking-[-0.02em] text-ganitel-text-title md:text-lg">
                      {t(item.questionKey)}
                    </AccordionTrigger>
                    <AccordionContent className="text-[15px] leading-[1.7] text-ganitel-text-subtitle md:text-base">
                      {t(item.answerKey)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          <p className="mt-12 text-sm leading-[1.7] text-ganitel-text-subtitle">
            {t("faq.still_need_help")}{" "}
            <a
              href={`mailto:${email}`}
              className="text-ganitel-text-title underline decoration-dotted underline-offset-4 hover:decoration-solid"
            >
              {email}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
