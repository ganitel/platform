import { SignIn } from "@clerk/react-router";

import type { Route } from "./+types/sign-in";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { clerkAppearance } from "@/features/auth/components/clerk-appearance";

export const meta: Route.MetaFunction = () => [
  { title: "Connexion — Ganitel" },
  { name: "robots", content: "noindex" },
];

export default function SignInPage() {
  return (
    <AuthShell title="Bienvenue" subtitle="Connexion">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}
