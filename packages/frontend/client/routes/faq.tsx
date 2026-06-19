import type { Route } from "./+types/faq";

import { FAQ_ITEMS } from "@/features/legal/faq-items";
import { Faq } from "@/features/legal/faq";
import { PUBLIC_HTML_CACHE } from "@/shared/lib/cache";
import { localeFromAcceptLanguage, t as translate } from "@/shared/lib/i18n";
import { seo } from "@/shared/lib/seo";

export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": PUBLIC_HTML_CACHE,
});

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const locale = loaderData?.locale ?? "fr";
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: translate(item.questionKey, locale),
      acceptedAnswer: {
        "@type": "Answer",
        text: translate(item.answerKey, locale),
      },
    })),
  };
  return seo({
    title: translate("faq.meta.title", locale),
    description: translate("faq.meta.description", locale),
    pathname: "/faq",
    locale,
    alternates: { fr: "/faq", en: "/faq" },
    jsonLd: faqJsonLd,
  });
};

export function loader({ request }: Route.LoaderArgs) {
  const locale = localeFromAcceptLanguage(
    request.headers.get("Accept-Language"),
  );
  return { locale };
}

export default function FaqRoute() {
  return <Faq />;
}
