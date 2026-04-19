import { Plane, Utensils, Bus, ShoppingBag, MapPin, Dumbbell } from "lucide-react";

export function AccompaniedServices() {
  const locations = [
    { label: "About 10 minutes drive to the airport", icon: Plane },
    { label: "About 10 minutes drive to the restaurant", icon: Utensils },
    { label: "About 10 minutes drive to the bus station", icon: Bus },
    { label: "About 10 minutes drive to the supermarket", icon: ShoppingBag },
    { label: "About 10 minutes drive to the mainroad", icon: MapPin },
    { label: "About 10 minutes drive to the gym", icon: Dumbbell },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-5">
      <h2 className="text-ganitel-text-title text-base font-bold">
        For your accessibility and convenience
      </h2>

      <div className="flex flex-col gap-4">
        {locations.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="shrink-0">
              <item.icon className="w-5 h-5 text-ganitel-text-label/60" strokeWidth={1.5} />
            </div>
            <p className="text-ganitel-text-label text-sm font-normal">
              About <span className="font-bold text-ganitel-text-title">10 minutes</span> drive to the {item.label.split('to the ')[1]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
