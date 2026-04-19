import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function RequestSent() {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-ganitel-neutral-1 flex flex-col md:w-[360px] mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-ganitel-accent-grey px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-ganitel-text-title">Ganitel.co</span>
        <span className="text-sm text-ganitel-text-label">Request sent</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
        <CheckCircle2 className="w-20 h-20 text-ganitel-primary" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-md border border-[#858E7E] bg-ganitel-accent-green px-3 py-1">
            <span className="text-sm font-medium text-ganitel-text-title">
              Negotiation request sent
            </span>
          </div>
          <p className="text-base font-medium text-ganitel-text-badge">
            Hosts usually respond within 2 hours (02:00)
          </p>
          <p className="text-sm text-ganitel-text-label">
            Redirecting to home in {secondsLeft}s
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-2 rounded-md bg-ganitel-primary px-5 py-2 text-sm font-semibold text-white"
        >
          Back to home
        </button>
      </div>

      {/* Home Indicator */}
      <div className="h-6 bg-white flex justify-center items-center">
        <div className="w-32 h-1 bg-black rounded-full" />
      </div>
    </div>
  );
}
