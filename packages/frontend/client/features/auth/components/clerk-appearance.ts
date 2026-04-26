/**
 * Shared appearance config for Clerk's <SignIn /> and <SignUp />.
 * Targets `cl-*` element keys so they survive Tailwind v4 preflight.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#18100C",
    colorText: "#18100C",
    colorTextSecondary: "#67615F",
    colorBackground: "#FFFFFF",
    colorInputBackground: "#FAFAFA",
    colorInputText: "#18100C",
    colorDanger: "#B42318",
    borderRadius: "0.75rem",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: "0.95rem",
  },
  elements: {
    rootBox: "w-full",
    card: "w-full bg-transparent shadow-none border-0 p-0",
    headerTitle: "font-infoma text-2xl text-ganitel-text-title",
    headerSubtitle: "text-sm text-ganitel-text-subtitle",
    socialButtonsBlockButton:
      "border border-ganitel-stroke-neutral hover:bg-ganitel-background-neutral2",
    socialButtonsBlockButtonText: "font-medium text-ganitel-text-title",
    dividerLine: "bg-ganitel-stroke-neutral",
    dividerText: "text-ganitel-text-subtitle",
    formFieldLabel: "text-xs uppercase tracking-wide text-ganitel-text-subtitle",
    formFieldInput:
      "h-11 rounded-xl border border-ganitel-stroke-neutral bg-ganitel-background-neutral1 px-3 focus:border-ganitel-primary focus:ring-2 focus:ring-ganitel-primary/15",
    formButtonPrimary:
      "h-11 rounded-xl bg-ganitel-primary text-ganitel-text-button hover:bg-ganitel-primary/90 transition",
    footerActionLink: "text-ganitel-text-title hover:text-ganitel-primary underline-offset-4",
    identityPreviewEditButton: "text-ganitel-text-title",
  },
} as const;
