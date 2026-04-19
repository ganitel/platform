import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";
import { Loader2, Mail, MoveLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { isDevAdminBypassEmail } from "@/services/auth.adapter";

type AuthStep = "email" | "otp";

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN_SECONDS = 30;
const DEV_ADMIN_BYPASS_TOKEN = "dev-admin-local-bypass";

const formatCountdown = (seconds: number): string => {
  const safeValue = Math.max(0, seconds);
  return `00:${String(safeValue).padStart(2, "0")}`;
};

export default function SignIn() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = useAuthContext();

  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_COUNTDOWN_SECONDS);
  
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  
  const isValidEmail = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);

  // Redirect if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate("/profile", { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  // Timer effect
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

  // Focus effect for OTP
  useEffect(() => {
    if (step === "otp") {
      window.setTimeout(() => {
        otpInputRefs.current[0]?.focus(); 
      }, 50);
    }
  }, [step]);

  const handleSendOtp = async () => {
    if (!isValidEmail || isSendingCode) return;

    setIsSendingCode(true);
    try {
      if (isDevAdminBypassEmail(email)) {
        await auth.verifyOtp(email.trim(), DEV_ADMIN_BYPASS_TOKEN);
        toast({
          title: "Connexion réussie",
          description: "Session admin locale activée (DEV).",
        });

        const searchParams = new URLSearchParams(window.location.search);
        const returnUrl = searchParams.get("returnUrl");
        navigate(returnUrl ? decodeURIComponent(returnUrl) : "/profile", { replace: true });
        return;
      }

      await auth.sendOtp(email.trim());
      setStep("otp");
      setOtpError("");
      setOtpValues(Array(OTP_LENGTH).fill(""));
      setResendTimer(RESEND_COUNTDOWN_SECONDS);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible d'envoyer le code. Réessayez.",
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
      toast({
        title: "Connexion réussie",
        description: "Bon retour parmi nous !",
      });
      
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get("returnUrl");
      navigate(returnUrl ? decodeURIComponent(returnUrl) : "/profile", { replace: true });
    } catch (err: any) {
      setOtpError(err?.message || "Code incorrect. Veuillez réessayer.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      await auth.signInWithGoogle();
      // signInWithGoogle redirects — we only reach here in mock mode
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Connexion Google impossible.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isVerifyingOtp) return;
    const digits = value.replace(/\D/g, "");
    const newOtp = [...otpValues];

    if (!digits) {
      newOtp[index] = "";
      setOtpValues(newOtp);
      return;
    }

    const chars = digits.split('');
    chars.forEach((char, i) => {
      if (index + i < OTP_LENGTH) {
        newOtp[index + i] = char;
      }
    });
    
    setOtpValues(newOtp);
    setOtpError("");

    const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
    if (digits.length === 1 && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    } else if (digits.length > 1) {
      otpInputRefs.current[nextIndex]?.focus();
    }

    if (newOtp.every(v => v !== "") && newOtp.length === OTP_LENGTH) {
      validateOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
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

  return (
    <div className="min-h-screen bg-ganitel-background-secondary">
      <Header />
      <main className="mx-auto w-full max-w-[360px] px-4 pb-6 pt-5">
        {step === "email" ? (
          <section>
            <div className="flex items-center justify-between mb-8">
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center text-ganitel-primary"
                onClick={() => navigate(-1)}
              >
                <MoveLeft className="h-6 w-6" />
              </button>
              <h1 className="text-[20px] font-bold text-ganitel-text-title">Connexion</h1>
              <div className="w-6" />
            </div>

            <p className="mt-3 text-center text-sm text-ganitel-text-subtitle mb-8">
              Connectez-vous pour accéder à votre compte
            </p>

            {/* Google OAuth button */}
            {/* <button
              type="button"
              disabled={isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-ganitel-text-label bg-ganitel-background-secondary text-base font-medium text-ganitel-text-title disabled:opacity-60"
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
              <label className="block text-base font-medium text-ganitel-text-title mb-3">
                Email
              </label>
              <div className="flex items-center gap-1.5 mb-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ganitel-primary text-ganitel-text-button">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-transparent bg-ganitel-neutral-2 px-4 text-base font-normal text-ganitel-text-title outline-none placeholder:text-ganitel-text-placeholder disabled:bg-ganitel-background-disabled disabled:text-ganitel-text-label"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@email.com"
                  disabled={isSendingCode}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!isValidEmail || isSendingCode}
              onClick={handleSendOtp}
              className="mt-14 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ganitel-secondary text-base font-medium text-ganitel-text-button disabled:bg-ganitel-background-disabled disabled:text-ganitel-text-label"
            >
              {isSendingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuer"}
            </button>

            <p className="mt-6 text-center text-sm text-ganitel-text-subtitle">
              Pas encore de compte ?{" "}
              <button
                type="button"
                className="font-medium text-ganitel-secondary"
                onClick={() => navigate("/sign-up")}
              >
                S'inscrire
              </button>
            </p>
          </section>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-8">
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center text-ganitel-primary"
                onClick={() => {
                  setStep("email");
                  setOtpError("");
                  setOtpValues(Array(OTP_LENGTH).fill(""));
                }}
              >
                <MoveLeft className="h-6 w-6" />
              </button>
              <h2 className="text-[20px] font-bold text-ganitel-text-title">Vérification</h2>
              <div className="w-6" />
            </div>

            <p className="mt-3 text-center text-sm text-ganitel-text-subtitle mb-8">
              Entrez le code envoyé à <span className="font-semibold">{email.trim()}</span>
            </p>

            <div className="grid grid-cols-6 gap-2 mb-8">
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  ref={(el) => { otpInputRefs.current[index] = el; }}
                  inputMode="numeric"
                  maxLength={1}
                  value={value}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isVerifyingOtp}
                  className={cn(
                    "h-11 w-full rounded-lg border bg-ganitel-background-secondary text-center text-[16px] font-medium caret-ganitel-text-title outline-none focus:border-ganitel-text-title",
                    value ? "border-ganitel-primary bg-ganitel-primary text-ganitel-text-button" : "border-ganitel-text-label text-ganitel-text-title"
                  )}
                />
              ))}
            </div>

            {otpError && <p className="text-center text-sm text-destructive mb-4 font-medium">{otpError}</p>}

            {isVerifyingOtp && <div className="mt-4 flex justify-center mb-4"><Loader2 className="animate-spin text-ganitel-primary" /></div>}

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-ganitel-text-label">
                  Renvoyer le code ({formatCountdown(resendTimer)})
                </p>
              ) : (
                <button
                  type="button"
                  className="text-sm font-medium text-ganitel-secondary"
                  onClick={handleResend}
                  disabled={isVerifyingOtp}
                >
                  Renvoyer le code
                </button>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
