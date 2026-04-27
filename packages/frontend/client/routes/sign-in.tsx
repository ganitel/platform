import { SignIn } from "@clerk/react-router";

import type { Route } from "./+types/sign-in";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { clerkAppearance } from "@/features/auth/components/clerk-appearance";

export const meta: Route.MetaFunction = () => [
  { title: "Connexion — Ganitel" },
  { name: "robots", content: "noindex" },
];

export default function SignInPage() {
  return (
    <AuthLayout title="Bienvenue" subtitle="Connexion">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        appearance={clerkAppearance}
      />
    </AuthLayout>
  );
}
