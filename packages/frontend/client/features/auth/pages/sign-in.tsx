import { SignIn } from "@clerk/clerk-react";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { clerkAppearance } from "@/features/auth/components/clerk-appearance";

export function SignInPage() {
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
