import type { TranslationKey } from "@/shared/lib/i18n";

export interface FaqItem {
  id: string;
  questionKey: TranslationKey;
  answerKey: TranslationKey;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: "booking_how",
    questionKey: "faq.q.booking_how.question",
    answerKey: "faq.q.booking_how.answer",
  },
  {
    id: "payment_methods",
    questionKey: "faq.q.payment_methods.question",
    answerKey: "faq.q.payment_methods.answer",
  },
  {
    id: "cancellation",
    questionKey: "faq.q.cancellation.question",
    answerKey: "faq.q.cancellation.answer",
  },
  {
    id: "regions",
    questionKey: "faq.q.regions.question",
    answerKey: "faq.q.regions.answer",
  },
  {
    id: "host_listing",
    questionKey: "faq.q.host_listing.question",
    answerKey: "faq.q.host_listing.answer",
  },
  {
    id: "verification",
    questionKey: "faq.q.verification.question",
    answerKey: "faq.q.verification.answer",
  },
  {
    id: "safety",
    questionKey: "faq.q.safety.question",
    answerKey: "faq.q.safety.answer",
  },
  {
    id: "languages",
    questionKey: "faq.q.languages.question",
    answerKey: "faq.q.languages.answer",
  },
  {
    id: "account",
    questionKey: "faq.q.account.question",
    answerKey: "faq.q.account.answer",
  },
] as const;
