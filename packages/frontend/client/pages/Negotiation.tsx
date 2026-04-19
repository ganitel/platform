import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Negotiation() {
  const navigate = useNavigate();
  const location = useLocation();
  const propertyData = location.state?.propertyData;

  const totalPrice = propertyData?.price ?? 240;
  const nights = propertyData?.nights ?? 7;
  const checkIn = propertyData?.checkIn ?? "Wed, 23 July";
  const checkOut = propertyData?.checkOut ?? "Wed, 30 July";
  const guests = propertyData?.guests ?? 4;
  const defaultOffer = Math.max(1, Math.round(totalPrice * 0.94));

  const [offer, setOffer] = useState<number>(defaultOffer);
  const [whatsapp, setWhatsapp] = useState("+33 1 23 45 67 89");

  const minOffer = useMemo(() => Math.max(1, Math.round(totalPrice * 0.92)), [totalPrice]);
  const maxOffer = totalPrice;

  const handleSubmit = () => {
    navigate("/booking/request-sent", {
      state: {
        propertyData,
        negotiation: {
          offer,
          whatsapp,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-ganitel-neutral-1 flex flex-col md:w-[360px] mx-auto pb-24">
      {/* Header */}
      <div className="bg-white border-b border-ganitel-accent-grey px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-ganitel-neutral-3"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-ganitel-primary" />
        </button>
        <h1 className="text-base font-bold text-ganitel-text-title">Negotiate your Stay</h1>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-6 space-y-4">
        {/* Trip Summary */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-ganitel-primary" />
            <h2 className="text-lg font-bold text-ganitel-text-title">Your trip</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-ganitel-text-label">Check-in</p>
              <p className="text-ganitel-text-title font-bold">{checkIn}</p>
              <p className="text-ganitel-text-label">5:00 PM</p>
              <div className="mt-2 flex items-center gap-2 text-ganitel-text-label">
                <Users className="w-4 h-4" />
                <span className="font-bold">Total guests : {guests}</span>
              </div>
            </div>
            <div>
              <p className="text-ganitel-text-label">Check-out</p>
              <p className="text-ganitel-text-title font-bold">{checkOut}</p>
              <p className="text-ganitel-text-label">12:00 PM</p>
              <div className="mt-2 flex items-center gap-2 text-ganitel-text-label">
                <Building2 className="w-4 h-4" />
                <span className="font-bold">1 Apartment</span>
              </div>
            </div>
          </div>
          <div className="h-px bg-ganitel-accent-grey" />
          <div className="flex items-center gap-2 text-base font-bold text-ganitel-text-title">
            <span>Total : ${totalPrice}</span>
            <span className="text-ganitel-text-label text-sm">/ {nights} Nights</span>
          </div>
        </div>

        {/* Offer Section */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <h3 className="text-lg font-bold text-ganitel-text-title">
            How much do you offer ($)?
          </h3>
          <div className="flex flex-col gap-3">
            <input
              type="range"
              min={minOffer}
              max={maxOffer}
              value={offer}
              onChange={(event) => setOffer(Number(event.target.value))}
              className="w-full accent-ganitel-primary"
            />
            <div className="flex items-center justify-between text-sm text-ganitel-text-badge">
              <span>{minOffer}</span>
              <span className="text-lg font-bold text-ganitel-text-title">{offer}</span>
              <span>{maxOffer}</span>
            </div>
            <Input
              type="number"
              min={minOffer}
              max={maxOffer}
              value={offer}
              onChange={(event) => setOffer(Number(event.target.value))}
              className="text-center font-semibold"
            />
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <h3 className="text-lg font-bold text-ganitel-text-title">
            Would you like to receive updates via WhatsApp?
          </h3>
          <label className="text-sm font-medium text-ganitel-text-title">
            WhatsApp Number
          </label>
          <div className="flex gap-2">
            <div className="flex items-center justify-center rounded-lg bg-ganitel-primary px-3 text-white text-sm font-semibold">
              FR
            </div>
            <Input
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              className="bg-ganitel-neutral-2"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="px-4 pb-6">
        <Button
          onClick={handleSubmit}
          className="w-full bg-ganitel-secondary hover:bg-ganitel-secondary/90 text-white"
        >
          Submit negotiation: ${offer}
        </Button>
      </div>

      {/* Home Indicator */}
      <div className="h-6 bg-white flex justify-center items-center">
        <div className="w-32 h-1 bg-black rounded-full" />
      </div>
    </div>
  );
}
