import { Link } from "react-router-dom";

import { Button } from "@/shared/ui/button";

export function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-infoma text-7xl text-ganitel-text-title">404</p>
      <h1 className="mt-4 text-xl font-semibold text-ganitel-text-title">Page introuvable</h1>
      <p className="mt-2 text-sm text-ganitel-text-subtitle">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Button asChild className="mt-6 bg-ganitel-primary text-ganitel-text-button hover:bg-ganitel-primary/90">
        <Link to="/">Retour à l'accueil</Link>
      </Button>
    </section>
  );
}
