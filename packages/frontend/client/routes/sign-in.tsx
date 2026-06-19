import type { Route } from "./+types/sign-in";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { PhoneLogin } from "@/features/auth/components/phone-login";
import { GoogleButton } from "@/features/auth/components/google-button";
import { localeFromAcceptLanguage, t, useT } from "@/shared/lib/i18n";

export async function loader({ request }: Route.LoaderArgs) {
  return {
    locale: localeFromAcceptLanguage(request.headers.get("Accept-Language")),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: t("sign_in.meta.title", loaderData?.locale ?? "fr") },
  { name: "robots", content: "noindex" },
];

export default function SignInPage() {
  const tr = useT();
  return (
    <AuthLayout title={tr("sign_in.welcome")} subtitle={tr("sign_in.subtitle")}>
      <div className="space-y-6">
        <GoogleButton />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ganitel-stroke-neutral" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-ganitel-background-neutral1 px-2 text-ganitel-text-subtitle">
              {tr("sign_in.or")}
            </span>
          </div>
        </div>

        <PhoneLogin />
      </div>
    </AuthLayout>
  );
}
