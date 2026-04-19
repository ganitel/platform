import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  ArrowLeft,
  CalendarClock,
  CarTaxiFront,
  ChevronRight,
  CircleDollarSign,
  Coins,
  HandCoins,
  Info,
  Landmark,
  UserPlus,
} from "lucide-react";

const mainStory = {
  title: "Residence MG",
  intro:
    "Home is not just a place, it is a feeling. RESIDENCE MG helps modern African travelers, especially Cameroonians in the diaspora, find trusted places to stay across Cameroon.",
  body:
    "We connect guests to verified hosts with flexible rates, direct negotiation, and clear pricing. Whether you travel solo, with family, or for a celebration, the booking experience is fast, transparent, and made for comfort.",
  cta: "Join Now",
};

const missionVisionCards = [
  {
    title: "Mission",
    text:
      "Empower Africans living abroad to rediscover home through trusted stays, affordability, and cultural connection.",
  },
  {
    title: "Vision",
    text:
      "Build the most trusted and flexible platform for booking stays that feel like home.",
  },
];

const rewardSteps = [
  {
    title: "Step 1: Register",
    text: "Create a free account in seconds.",
    icon: <UserPlus className="h-5 w-5 text-black" />,
  },
  {
    title: "Step 2: Refer a friend",
    text: "Share your referral link and invite friends.",
    icon: <HandCoins className="h-5 w-5 text-black" />,
  },
  {
    title: "Step 3: Earn rewards",
    text: "Get bonuses when you or your referrals book.",
    icon: <Coins className="h-5 w-5 text-black" />,
  },
  {
    title: "Step 4: Book and save",
    text: "Use your bonuses on your next stay.",
    icon: <CircleDollarSign className="h-5 w-5 text-black" />,
  },
];

const serviceCards = [
  {
    title: "Drop-off after checkout",
    image:
      "https://api.builder.io/api/v1/image/assets/TEMP/8ad6cf74afe98f398c65dcf9fbd1fb49f7673641?width=292",
  },
  {
    title: "Car rentals",
    image:
      "https://api.builder.io/api/v1/image/assets/TEMP/ca67f54bf0add17441cecc308e7d49bad476fbac?width=292",
  },
  {
    title: "Pick-up on arrival",
    image:
      "https://api.builder.io/api/v1/image/assets/TEMP/30608ec0e6be2022a2bc574bba1716bad050ccf8?width=292",
  },
  {
    title: "Flexible checkout",
    image:
      "https://api.builder.io/api/v1/image/assets/TEMP/3b55793893bf80bc49197d0c8c5d5285c077943d?width=292",
  },
  {
    title: "Local assistance",
    image:
      "https://api.builder.io/api/v1/image/assets/TEMP/67077d180606c47adc1478ffed1ae1120c78c475?width=292",
  },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:w-[360px] mx-auto">
      <Header />

      <div className="bg-[#FAFAFA] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate("/profile")}
          className="inline-flex items-center gap-2 text-black"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-infoma text-[20px] font-bold leading-5">About us</span>
        </button>

        <button
          type="button"
          aria-label="About details"
          className="rounded-full p-1 text-black"
        >
          <Info className="h-5 w-5" />
        </button>
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-10 space-y-8">
        <section className="space-y-4">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/b0c53bb7e082706f8cecfbea59c8966d2793f3a0?width=656"
            alt="Residence MG"
            className="h-[147px] w-full rounded-lg object-cover opacity-80"
          />

          <div className="space-y-4">
            <h1 className="font-infoma text-[28px] font-bold leading-7 text-[#18100C]">
              {mainStory.title}
            </h1>
            <p className="text-[#67615F] text-base leading-7 tracking-[-0.32px]">
              {mainStory.intro}
            </p>
            <p className="text-[#67615F] text-base leading-7 tracking-[-0.32px]">
              {mainStory.body}
            </p>

            <div className="space-y-2 text-[#67615F] text-base leading-7 tracking-[-0.32px]">
              <p>
                <span className="font-infoma font-bold">Create your free account</span> and start exploring top guest houses.
              </p>
              <p>
                <span className="font-infoma font-bold">Refer and invite friends</span> to unlock exclusive rewards.
              </p>
              <p>
                <span className="font-infoma font-bold">Earn bonuses on every booking</span> and save more over time.
              </p>
            </div>

            <button className="h-[45px] w-[184px] rounded-lg bg-[#D39E70] px-4 text-white font-infoma text-base tracking-[-0.32px]">
              {mainStory.cta}
            </button>
          </div>
        </section>

        <section className="space-y-3">
          {missionVisionCards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl bg-white px-3 py-4 text-center shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
            >
              <div className="mb-3 inline-flex items-center gap-2">
                {card.title === "Mission" ? (
                  <Landmark className="h-5 w-5 text-black" />
                ) : (
                  <CalendarClock className="h-5 w-5 text-black" />
                )}
                <h2 className="font-infoma text-base font-bold leading-4 tracking-[-0.32px] text-[#18100C]">
                  {card.title}
                </h2>
              </div>
              <p className="text-[#67615F] text-sm leading-[16.8px] tracking-[-0.28px]">
                {card.text}
              </p>
            </article>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="font-infoma text-[28px] font-bold leading-7 text-[#18100C]">
            Do you own or manage a furnished accommodation?
          </h2>
          <p className="text-[#67615F] text-sm leading-[16.8px] tracking-[-0.28px]">
            List your property on our platform and connect with guests who appreciate flexible rates and quality stays.
          </p>
          <button className="h-[45px] w-[184px] rounded-lg bg-[#D39E70] px-4 text-white font-infoma text-base tracking-[-0.32px]">
            Start hosting today
          </button>
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/9c12b66ec744e2d60aefdcf36a69746b45e9924f?width=656"
            alt="Hosting"
            className="h-[147px] w-full rounded-b-lg object-cover opacity-80"
          />
        </section>

        <section className="space-y-4">
          <div
            className="relative overflow-hidden rounded-t-lg bg-cover bg-center px-10 pb-16 pt-3"
            style={{
              backgroundImage:
                "url('https://api.builder.io/api/v1/image/assets/TEMP/77226641f8c86d4670da11a6b9a3d2c3c01dc592?width=656')",
            }}
          >
            <div className="w-fit rounded-lg bg-white p-3">
              <div className="mb-1 inline-flex items-center gap-2">
                <h3 className="font-infoma text-base font-bold leading-4 tracking-[-0.32px] text-[#18100C]">
                  Earn Rewards
                </h3>
                <span aria-hidden="true">|</span>
              </div>
              <p className="text-[#67615F] text-sm leading-[16.8px] tracking-[-0.28px]">
                Book and refer to unlock bonuses.
              </p>
            </div>
          </div>

          <h2 className="font-infoma text-[28px] font-bold leading-7 text-[#18100C]">
            Earn Rewards and Save More!
          </h2>
          <p className="text-[#67615F] text-sm leading-[16.8px] tracking-[-0.28px]">
            Join our loyalty and referral program to get exclusive bonuses whenever you book or invite friends.
          </p>

          <div className="space-y-[10px]">
            {rewardSteps.map((step) => (
              <article
                key={step.title}
                className="flex min-h-[54px] items-center gap-2 rounded-lg bg-[#E1E0DF] px-3 py-3"
              >
                {step.icon}
                <div>
                  <h4 className="font-infoma text-sm font-bold leading-4 tracking-[-0.28px] text-[#18100C]">
                    {step.title}
                  </h4>
                  <p className="text-[#67615F] text-xs leading-[14.4px] tracking-[-0.24px]">
                    {step.text}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <button className="h-[45px] w-[184px] rounded-lg bg-[#D39E70] px-4 text-white font-infoma text-base tracking-[-0.32px]">
            Join Now
          </button>
        </section>

        <section className="space-y-6">
          <div className="space-y-4">
            <h2 className="font-infoma text-[28px] font-bold leading-7 text-[#18100C]">
              Why book with us?
            </h2>
            <div className="inline-flex items-center gap-2">
              <div className="h-[18px] w-1 bg-[#D39E70]" />
              <h3 className="font-infoma text-base font-bold leading-4 tracking-[-0.32px] text-[#18100C]">
                What we offer
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {serviceCards.map((card) => (
              <article key={card.title} className="space-y-2">
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-[97px] w-full rounded-lg border-2 border-[#D39E70] object-cover"
                />
                <p className="text-[#67615F] text-xs leading-[14.4px] tracking-[-0.24px]">
                  {card.title}
                </p>
              </article>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[#18100C]">
            <CarTaxiFront className="h-5 w-5" />
            <span className="font-infoma text-sm">More services available on booking</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}