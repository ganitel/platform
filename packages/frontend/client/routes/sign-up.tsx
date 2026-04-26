import { SignUp } from "@clerk/react-router";

import type { Route } from "./+types/sign-up";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { clerkAppearance } from "@/features/auth/components/clerk-appearance";

export const meta: Route.MetaFunction = () => [
  { title: "Inscription — Ganitel" },
  { name: "robots", content: "noindex" },
];

export default function SignUpPage() {
  return (
    <AuthShell title="Créer votre compte" subtitle="Inscription">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}
