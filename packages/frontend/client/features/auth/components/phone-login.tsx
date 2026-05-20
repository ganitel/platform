import { useState } from "react";
import { useNavigate } from "react-router";

import { PhoneInput } from "@/shared/components/phone-input";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/shared/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/ui/input-otp";
import { Label } from "@/shared/ui/label";

type Step = "phone" | "otp";

export function PhoneLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(true);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await getSupabase().auth.signInWithOtp({
      phone,
      options: { channel: "sms" },
    });
    setLoading(false);
    if (err) {
      setError(err.message || "Erreur lors de l'envoi du code.");
      return;
    }
    setStep("otp");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: err } = await getSupabase().auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (err) {
      setError(err.message || "Code invalide.");
      return;
    }
    const name = data.user?.user_metadata?.name as string | undefined;
    navigate(name ? "/" : "/complete-profile");
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
      <PhoneInput
        id="phone"
        label="Numéro de téléphone"
        onChange={(value, isValid) => {
          setPhone(value);
          setPhoneValid(isValid);
        }}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        type="submit"
        disabled={loading || !phone.trim() || !phoneValid}
        className="h-11 w-full rounded-xl bg-ganitel-primary text-ganitel-text-button hover:bg-ganitel-primary/90"
      >
        {loading ? "Envoi…" : "Recevoir un code"}
      </Button>
    </form>
  );
}
