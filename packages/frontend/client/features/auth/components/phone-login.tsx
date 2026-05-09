import { useState } from "react";
import { useNavigate } from "react-router";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/ui/input-otp";
import { Label } from "@/shared/ui/label";

type Step = "phone" | "otp";

export function PhoneLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "Erreur lors de l'envoi du code.");
      return;
    }
    setStep("otp");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await authClient.phoneNumber.verify({
      phoneNumber: phone,
      code: otp,
    });
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "Code invalide.");
      return;
    }
    // Redirect to complete-profile if no display name set yet.
    const session = await authClient.getSession();
    const name = session.data?.user?.name ?? "";
    const isPlaceholderName =
      name.startsWith("+") || /^\+?\d+$/.test(name.replace(/\s/g, ""));
    navigate(isPlaceholderName ? "/complete-profile" : "/");
  }

  if (step === "otp") {
    return (
      <form onSubmit={verifyOtp} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Code reçu par SMS</Label>
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p className="text-xs text-ganitel-text-subtitle">
            Envoyé au {phone}
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={loading || otp.length < 6}
          className="h-11 w-full rounded-xl bg-ganitel-primary text-ganitel-text-button hover:bg-ganitel-primary/90"
        >
          {loading ? "Vérification…" : "Connexion"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setOtp("");
            setError(null);
          }}
          className="block w-full text-center text-xs text-ganitel-text-subtitle hover:underline"
        >
          Changer de numéro
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="phone">Numéro de téléphone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+237 6XX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          required
          className="h-11"
        />
        <p className="text-xs text-ganitel-text-subtitle">
          Inclure le code pays (ex. +237)
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        type="submit"
        disabled={loading || !phone.trim()}
        className="h-11 w-full rounded-xl bg-ganitel-primary text-ganitel-text-button hover:bg-ganitel-primary/90"
      >
        {loading ? "Envoi…" : "Recevoir un code"}
      </Button>
    </form>
  );
}
