import { MessageCircle, Star } from "lucide-react";

interface HostInfoProps {
  host: {
    name: string;
    rating: string;
    reviews: number;
    avatar: string;
    message: string;
  };
}

export function HostInfo({ host }: HostInfoProps) {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-4">
      <h2 className="text-ganitel-text-title text-lg font-bold">
        Meet your host
      </h2>

      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-ganitel-neutral-3 overflow-hidden flex-shrink-0">
          <img src={host.avatar} alt={host.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col gap-0.5 flex-1">
          <h3 className="text-ganitel-text-title text-base font-bold">
            {host.name}
          </h3>
          <p className="text-ganitel-text-label text-xs font-medium">Superhost</p>
          <div className="flex items-center gap-0.5 mt-0.5">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" strokeWidth={0} />
            <span className="text-ganitel-text-label text-xs font-normal">
              {host.rating} ({host.reviews})
            </span>
          </div>
        </div>
      </div>

      <p className="text-ganitel-text-label text-sm font-normal leading-relaxed">
        {host.message}
      </p>

      <button className="w-full bg-ganitel-primary text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98] font-bold text-sm">
        Message Host
        <MessageCircle className="w-4 h-4" />
      </button>
    </div>
  );
}
