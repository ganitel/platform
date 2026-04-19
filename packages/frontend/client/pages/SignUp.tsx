import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";
import { Loader2, Mail, MoveLeft, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";

type SignUpStep = "email" | "otp" | "profile" | "success";

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN_SECONDS = 30;

const formatCountdown = (seconds: number): string => {
  const safeValue = Math.max(0, seconds);
  return `00:${String(safeValue).padStart(2, "0")}`;
};

export default function SignUp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = useAuthContext();

  const [step, setStep] = useState<SignUpStep>("email");
  const [email, setEmail] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // OTP state
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_COUNTDOWN_SECONDS);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Profile info state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const isValidEmail = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const canSubmitProfile = firstName.trim().length >= 2 && lastName.trim().length >= 2;

  const currentStepLabel = step === "email" ? "1/3" : step === "otp" ? "2/3" : "3/3";

  // Redirect if already authenticated (except during success screen)
  useEffect(() => {
    if (auth.isAuthenticated && step !== "success" && step !== "profile") {
      navigate("/", { replace: true });
    }
  }, [auth.isAuthenticated, step, navigate]);

  // Timer
  useEffect(() => {
    if (step !== "otp" || resendTimer <= 0) return;
    const timer = window.setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, resendTimer]);

  // Focus OTP
  useEffect(() => {
    if (step === "otp") {
      window.setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 50);
    }
  }, [step]);

  // Auto-redirect from success screen
  useEffect(() => {
    if (step !== "success") return;
    const timer = window.setTimeout(() => {
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get("returnUrl");
      navigate(returnUrl ? decodeURIComponent(returnUrl) : "/", { replace: true });
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [step, navigate]);

  const handleSendOtp = async () => {
    if (!isValidEmail || isSendingCode) return;
    setIsSendingCode(true);
    try {
      await auth.sendOtp(email.trim());
      setStep("otp");
      setOtpError("");
      setOtpValues(Array(OTP_LENGTH).fill(""));
      setResendTimer(RESEND_COUNTDOWN_SECONDS);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible d'envoyer le code.",
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const validateOtp = async (otp: string) => {
    setIsVerifyingOtp(true);
    setOtpError("");
    try {
      await auth.verifyOtp(email.trim(), otp);
      // OTP verified — now collect profile info
      setStep("profile");
    } catch (err: any) {
      setOtpError(err?.message || "Code incorrect. Veuillez réessayer.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleRegister = async () => {
    if (!canSubmitProfile || isRegistering) return;
    setIsRegistering(true);
    try {
      // Generate a random password since we use OTP — backend requires password field
      const tempPassword = crypto.randomUUID();
      await auth.register({
        email: email.trim(),
        password: tempPassword,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || '',
        user_type: 'traveler',
        country: '',
        city: '',
      });
      setStep("success");
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Erreur lors de l'inscription.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      await auth.signInWithGoogle();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Connexion Google impossible.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  const applyOtpValueFromIndex = (startIndex: number, rawValue: string) => {
    if (isVerifyingOtp) return;
    const digits = rawValue.replace(/\D/g, "");
    const nextOtpValues = [...otpValues];

    if (!digits) {
      nextOtpValues[startIndex] = "";
      setOtpValues(nextOtpValues);
      setOtpError("");
      return;
    }

    const limit = Math.min(OTP_LENGTH - startIndex, digits.length);
    for (let offset = 0; offset < limit; offset += 1) {
      nextOtpValues[startIndex + offset] = digits[offset];
    }

    setOtpValues(nextOtpValues);
    setOtpError("");

    const nextFocusIndex = Math.min(startIndex + limit, OTP_LENGTH - 1);
    otpInputRefs.current[nextFocusIndex]?.focus();

    const otp = nextOtpValues.join("");
    if (otp.length === OTP_LENGTH && !nextOtpValues.includes("")) {
      validateOtp(otp);
    }
  };

  const handleOtpChange = (index: number, nextValue: string) => {
    applyOtpValueFromIndex(index, nextValue);
  };

  const handleOtpPaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    applyOtpValueFromIndex(index, event.clipboardData.getData("text"));
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtpError("");
    setOtpValues(Array(OTP_LENGTH).fill(""));
    setResendTimer(RESEND_COUNTDOWN_SECONDS);
    otpInputRefs.current[0]?.focus();
    try {
      await auth.sendOtp(email.trim());
      toast({ description: "Nouveau code envoyé" });
    } catch {
      toast({ description: "Erreur lors du renvoi du code", variant: "destructive" });
    }
  };

  // Success screen
  if (step === "success") {
    return (
      <div className="min-h-screen bg-ganitel-background-secondary">
        <Header />
        <main className="mx-auto w-full max-w-[360px] px-4 pb-6 pt-5 text-center">
          <div className="mt-[140px] flex flex-col items-center">
            <p className="text-[100px] leading-[1]" aria-hidden="true">🎊</p>
            <div className="mt-8 inline-flex items-center justify-center rounded border border-ganitel-accent-grey bg-ganitel-accent-green px-1.5 py-1.5">
              <span className="text-base font-medium leading-4 text-ganitel-text-title">Félicitations</span>
            </div>
            <h1 className="mt-6 text-[32px] font-medium leading-8 text-ganitel-text-title">Bienvenue !</h1>
            <p className="mt-4 text-sm text-ganitel-text-subtitle">Redirection en cours...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ganitel-background-secondary">
      <Header />
      <main className="mx-auto w-full max-w-[360px] px-4 pb-6 pt-5">

        {/* Step 1: Email input */}
        {step === "email" && (
          <section>
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center text-ganitel-primary"
                aria-label="Fermer"
                onClick={() => navigate(-1)}
              >
                <X className="h-6 w-6" />
              </button>
              <h1 className="text-[20px] font-bold leading-[20px] text-ganitel-text-title">Inscription</h1>
              <div className="inline-flex h-8 items-center justify-center rounded-lg border border-ganitel-primary px-2.5 text-xs font-bold leading-[14px] text-ganitel-primary">
                {currentStepLabel}
              </div>
            </div>

            <p className="mt-3 text-center text-sm leading-4 text-ganitel-text-subtitle mb-8">
              Créez votre compte pour voyager sereinement
            </p>

            {/* Google OAuth */}
            {/* <button
              type="button"
              disabled={isGoogleLoading}
              onClick={handleGoogleSignUp}
              className="mt-8 flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-ganitel-text-label bg-ganitel-background-secondary text-base font-medium text-ganitel-text-title disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuer avec Google
                </>
              )}
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-ganitel-text-label/30" />
              <span className="text-xs text-ganitel-text-label">OU</span>
              <div className="h-px flex-1 bg-ganitel-text-label/30" />
            </div> */}

            {/* Email input */}
            <div>
              <label htmlFor="email" className="block text-base font-medium leading-4 text-ganitel-text-title">
                Email
              </label>
              <div className="mt-3 flex items-center gap-1.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ganitel-primary text-ganitel-text-button">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={isSendingCode}
                  className="h-11 w-full rounded-lg border border-transparent bg-ganitel-neutral-2 px-4 text-base font-normal text-ganitel-text-title outline-none placeholder:text-ganitel-text-placeholder disabled:bg-ganitel-background-disabled disabled:text-ganitel-text-label"
                  placeholder="nom@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  aria-label="Email"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!isValidEmail || isSendingCode}
              onClick={handleSendOtp}
              className="mt-14 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ganitel-secondary text-base font-medium leading-4 text-ganitel-text-button disabled:bg-ganitel-background-disabled disabled:text-ganitel-text-label"
            >
              {isSendingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuer"}
            </button>

            <p className="mt-6 text-center text-sm text-ganitel-text-subtitle">
              Déjà un compte ?{" "}
              <button
                type="button"
                className="font-medium text-ganitel-secondary"
                onClick={() => navigate("/sign-in")}
              >
                Se connecter
              </button>
            </p>
          </section>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <section>
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center text-ganitel-primary"
                aria-label="Retour"
                onClick={() => {
                  setStep("email");
                  setOtpError("");
                  setOtpValues(Array(OTP_LENGTH).fill(""));
                }}
              >
                <MoveLeft className="h-6 w-6" />
              </button>
              <h2 className="text-[20px] font-bold leading-[20px] text-ganitel-text-title">Vérification</h2>
              <div className="inline-flex h-8 items-center justify-center rounded-lg border border-ganitel-primary px-2.5 text-xs font-bold leading-[14px] text-ganitel-primary">
                2/3
              </div>
            </div>

            <p className="mt-3 text-center text-sm leading-4 text-ganitel-text-subtitle">
              Entrez le code envoyé à <span className="font-semibold">{email.trim()}</span>
            </p>

            <div className="mt-8 grid grid-cols-6 gap-2">
              {otpValues.map((value, index) => (
                <input
                  key={`otp-${index}`}
                  ref={(el) => { otpInputRefs.current[index] = el; }}
                  inputMode="numeric"
                  maxLength={1}
                  value={value}
                  disabled={isVerifyingOtp}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onPaste={(e) => handleOtpPaste(index, e)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className={cn(
                    "h-11 w-full rounded-lg border border-ganitel-text-label bg-ganitel-background-secondary text-center text-[16px] font-medium leading-4 caret-ganitel-text-title outline-none focus:border-ganitel-text-title disabled:opacity-100",
                    value ? "border-ganitel-primary bg-ganitel-primary text-ganitel-text-button" : "text-ganitel-text-title",
                  )}
                  aria-label={`Chiffre ${index + 1}`}
                />
              ))}
            </div>

            {otpError && <p className="mt-8 text-sm font-medium leading-4 text-destructive">{otpError}</p>}
            {isVerifyingOtp && <div className="mt-4 flex justify-center"><Loader2 className="animate-spin text-ganitel-primary" /></div>}

            {resendTimer > 0 ? (
              <p className="mt-14 text-[14px] font-medium leading-4 text-ganitel-text-label">
                Renvoyer le code ({formatCountdown(resendTimer)})
              </p>
            ) : (
              <button
                type="button"
                className="mt-14 text-sm font-medium leading-4 text-ganitel-secondary"
                onClick={handleResend}
                disabled={isVerifyingOtp}
              >
                Renvoyer le code
              </button>
            )}
          </section>
        )}

        {/* Step 3: Profile info collection */}
        {step === "profile" && (
          <section>
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center text-ganitel-primary"
                aria-label="Retour"
                onClick={() => setStep("otp")}
              >
                <MoveLeft className="h-6 w-6" />
              </button>
              <h2 className="text-[20px] font-bold leading-[20px] text-ganitel-text-title">Vos informations</h2>
              <div className="inline-flex h-8 items-center justify-center rounded-lg border border-ganitel-primary px-2.5 text-xs font-bold leading-[14px] text-ganitel-primary">
                3/3
              </div>
            </div>

            <p className="mt-3 text-center text-sm leading-4 text-ganitel-text-subtitle">
              Complétez votre profil pour finaliser l'inscription
            </p>

            <div className="mt-8 space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-ganitel-text-title mb-1.5">
                  Prénom *
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  className="h-11 w-full rounded-lg border border-transparent bg-ganitel-neutral-2 px-4 text-base font-normal text-ganitel-text-title outline-none placeholder:text-ganitel-text-placeholder"
                  placeholder="Votre prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-ganitel-text-title mb-1.5">
                  Nom *
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  className="h-11 w-full rounded-lg border border-transparent bg-ganitel-neutral-2 px-4 text-base font-normal text-ganitel-text-title outline-none placeholder:text-ganitel-text-placeholder"
                  placeholder="Votre nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-ganitel-text-title mb-1.5">
                  Téléphone
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className="h-11 w-full rounded-lg border border-transparent bg-ganitel-neutral-2 px-4 text-base font-normal text-ganitel-text-title outline-none placeholder:text-ganitel-text-placeholder"
                  placeholder="+237 6XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!canSubmitProfile || isRegistering}
              onClick={handleRegister}
              className="mt-10 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ganitel-secondary text-base font-medium leading-4 text-ganitel-text-button disabled:bg-ganitel-background-disabled disabled:text-ganitel-text-label"
            >
              {isRegistering ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer mon compte"}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
