import { ArrowLeft, ArrowRight } from "lucide-react";

interface PromotionBannerProps {
  title: string;
  buttonText: string;
  imageUrl: string;
  variant: "green" | "brown";
}

export function PromotionBanner({ title, buttonText, imageUrl, variant }: PromotionBannerProps) {
  const bgGradient = variant === "green"
    ? "linear-gradient(107deg, #7F826D 42.55%, #A3A88D 70.17%, #D1D7B5 98.62%)"
    : "linear-gradient(107deg, #74573E 42.55%, #967050 70.17%, #C09066 98.62%)";

  return (
    <div 
      className="flex items-center justify-between p-3 rounded-xl w-full max-w-[328px]"
      style={{ background: bgGradient }}
    >
      <div className="flex-1 flex flex-col justify-center gap-[17px] pr-2">
        <h3 className="text-white text-xl font-bold leading-5">
          {title}
        </h3>
        <button className="flex items-center gap-1 px-3 py-1.5 justify-center rounded-lg bg-ganitel-primary w-fit">
          <div className="p-0.5 rounded bg-[rgba(116,112,109,0.4)]">
            <ArrowLeft className="w-4 h-4 text-white" strokeWidth={1} />
          </div>
          <span className="text-white text-sm font-medium leading-4 tracking-[-0.28px] px-0 py-1.5">
            {buttonText}
          </span>
          <div className="p-0.5 rounded bg-[rgba(116,112,109,0.4)]">
            <ArrowRight className="w-4 h-4 text-white" strokeWidth={1} />
          </div>
        </button>
      </div>
      <div className="w-[120px] h-[120px] flex items-center justify-center flex-shrink-0">
        <img 
          src={imageUrl} 
          alt="" 
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
