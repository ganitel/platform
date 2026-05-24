import { useState } from "react";
import { useNavigate } from "react-router";

import { PhoneInput } from "@/shared/components/phone-input";
import { getSupabase } from "@/lib/supabase";
import { useT } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/ui/input-otp";
import { Label } from "@/shared/ui/label";

type Step = "phone" | "otp";

export function PhoneLogin() {
  const tr = useT();
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
      setError(err.message || tr("auth.phone.send_error"));
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
      setError(err.message || tr("auth.otp.invalid"));
      return;
    }
    const name = data.user?.user_metadata?.name as string | undefined;
    navigate(name ? "/" : "/complete-profile");
  }

  if (step === "otp") {
    return (
      <form onSubmit={verifyOtp} className="space-y-4">
        <div className="space-y-1.5">
          <Label>{tr("auth.otp.label")}</Label>
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p className="text-xs text-ganitel-text-subtitle">
            {tr("auth.otp.sent_to").replace("{phone}", phone)}
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={loading || otp.length < 6}
          className="h-11 w-full rounded-xl bg-ganitel-primary text-ganitel-text-button hover:bg-ganitel-primary/90"
        >
          {loading ? tr("auth.otp.verifying") : tr("auth.otp.submit")}
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
          {tr("auth.otp.change_number")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
      <PhoneInput
        id="phone"
        label={tr("auth.phone.label")}
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
        {loading ? tr("auth.phone.sending") : tr("auth.phone.send_code")}
      </Button>
    </form>
  );
}
