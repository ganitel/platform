import { redirect } from "react-router";

// better-auth's phone OTP and Google sign-in handle both new and existing
// users in a single flow — there is no separate sign-up page.
export function loader() {
  return redirect("/sign-in");
}

export default function SignUpPage() {
  return null;
}
