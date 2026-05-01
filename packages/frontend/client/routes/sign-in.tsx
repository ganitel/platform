import type { Route } from "./+types/sign-in";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { PhoneLogin } from "@/features/auth/components/phone-login";
import { GoogleButton } from "@/features/auth/components/google-button";

export const meta: Route.MetaFunction = () => [
  { title: "Connexion — Ganitel" },
  { name: "robots", content: "noindex" },
];

export default function SignInPage() {
  return (
    <AuthLayout title="Bienvenue" subtitle="Connexion">
      <div className="space-y-6">
        <GoogleButton />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ganitel-stroke-neutral" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-ganitel-background-neutral1 px-2 text-ganitel-text-subtitle">
              ou
            </span>
          </div>
        </div>

        <PhoneLogin />
      </div>
    </AuthLayout>
  );
}
