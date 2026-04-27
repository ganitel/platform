import { SignUp } from "@clerk/react-router";

import type { Route } from "./+types/sign-up";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { clerkAppearance } from "@/features/auth/components/clerk-appearance";

export const meta: Route.MetaFunction = () => [
  { title: "Inscription — Ganitel" },
  { name: "robots", content: "noindex" },
];

export default function SignUpPage() {
  return (
    <AuthLayout title="Créer votre compte" subtitle="Inscription">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        appearance={clerkAppearance}
      />
    </AuthLayout>
  );
}
