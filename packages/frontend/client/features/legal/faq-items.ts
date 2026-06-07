import type { TranslationKey } from "@/shared/lib/i18n";

export type FaqCategory = "travelers" | "hosts";

export interface FaqItem {
  id: string;
  category: FaqCategory;
  questionKey: TranslationKey;
  answerKey: TranslationKey;
}

export const FAQ_CATEGORIES: readonly {
  id: FaqCategory;
  labelKey: TranslationKey;
}[] = [
  { id: "travelers", labelKey: "faq.category.travelers" },
  { id: "hosts", labelKey: "faq.category.hosts" },
] as const;

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: "booking_how",
    category: "travelers",
    questionKey: "faq.q.booking_how.question",
    answerKey: "faq.q.booking_how.answer",
  },
  {
    id: "payment_methods",
    category: "travelers",
    questionKey: "faq.q.payment_methods.question",
    answerKey: "faq.q.payment_methods.answer",
  },
  {
    id: "cancellation",
    category: "travelers",
    questionKey: "faq.q.cancellation.question",
    answerKey: "faq.q.cancellation.answer",
  },
  {
    id: "regions",
    category: "travelers",
    questionKey: "faq.q.regions.question",
    answerKey: "faq.q.regions.answer",
  },
  {
    id: "verification",
    category: "travelers",
    questionKey: "faq.q.verification.question",
    answerKey: "faq.q.verification.answer",
  },
  {
    id: "safety",
    category: "travelers",
    questionKey: "faq.q.safety.question",
    answerKey: "faq.q.safety.answer",
  },
  {
    id: "host_listing",
    category: "hosts",
    questionKey: "faq.q.host_listing.question",
    answerKey: "faq.q.host_listing.answer",
  },
] as const;
