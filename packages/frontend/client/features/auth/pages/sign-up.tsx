import { SignUp } from "@clerk/clerk-react";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { clerkAppearance } from "@/features/auth/components/clerk-appearance";

export function SignUpPage() {
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
