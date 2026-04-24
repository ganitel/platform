import { type ReactNode, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleEllipsis,
  CreditCard,
  DatabaseIcon,
  Loader2,
  LogOut,
  PhoneCall,
  Shield,
  UserPenIcon,
} from "lucide-react";

type ProfileMenuItem = {
  label: string;
  icon: ReactNode;
  to: string;
};

type ProfileSection = {
  title?: string;
  items: ProfileMenuItem[];
};

export default function Profile() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile, isLoading, isError } = useProfile();

  const fullName = useMemo(() => {
    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
    return name || profile?.email || "User";
  }, [profile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err: unknown) {
      console.error("Erreur lors de la deconnexion:", err);
    }
  };

  const sectionData: ProfileSection[] = [
    {
      items: [
        {
          label: "Manage trips or listings",
          icon: <DatabaseIcon className="h-5 w-5 text-black" />,
          to: "/profile/personal-information",
        },
        {
          label: "Update personal data",
          icon: <UserPenIcon className="h-5 w-5 text-black" />,
          to: "/my-properties",
        },
        {
          label: "Manage payments",
          icon: <CreditCard className="h-5 w-5 text-black" />,
          to: "/my-properties",
        }
      ],
    },
    {
      items: [
        {
          label: "Control security",
          icon: <Shield className="h-5 w-5 text-black" />,
          to: "/about",
        },
        {
          label: "Receive notifications",
          icon: <Bell className="h-5 w-5 text-black" />,
          to: "/help",
        },
        {
          label: "Contact support",
          icon: <PhoneCall className="h-5 w-5 text-black" />,
          to: "/help",
        }
      ],
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:w-[360px] mx-auto">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-ganitel-text-label">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:w-[360px] mx-auto">
        <Header />
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="bg-white rounded-xl p-4 space-y-4 border border-[#E1E0DF]">
            <h2 className="text-lg font-bold">Unable to load your profile</h2>
            <p className="text-sm text-ganitel-text-label">
              An error occurred. Please try again or go back.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
              <Button variant="secondary" onClick={() => navigate("/")}>Back</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:w-[360px] mx-auto pb-8">
      <Header />

      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-black"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-infoma text-[20px] font-bold leading-5">MyProfile</span>
          </button>

          <button
            aria-label="More options"
            className="rounded-full p-1 text-black"
            type="button"
          >
            <CircleEllipsis className="w-5 h-5" />
          </button>
        </div>

        <section className="flex items-center gap-[5px]">
          <Avatar className="h-[94px] w-[94px]">
            {profile.profile_picture ? (
              <AvatarImage src={profile.profile_picture} alt={fullName} />
            ) : (
              <AvatarFallback className="text-xl font-semibold">
                {fullName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex flex-col gap-[10px]">
            <p className="font-infoma text-[20px] font-bold leading-5 text-black">{fullName}</p>
            <p className="font-infoma text-base leading-4 tracking-[-0.32px] text-[#716B69]">
              {profile.email}
            </p>
            {profile.phone && (
              <p className="font-infoma text-base leading-4 tracking-[-0.32px] text-[#716B69]">
                {profile.phone}
              </p>
            )}
          </div>
        </section>
        
        <hr className="text-[#716B69]"></hr>
        
        {sectionData.map((section) => (
          <section key={section.title} className="space-y-[10px]">
            <h3 className="font-infoma text-sm leading-4 tracking-[-0.28px] text-black">
              {section.title}
            </h3>

            <div className="overflow-hidden rounded-[2px] border border-[#E1E0DF] bg-white">
              {section.items.map((item, index) => (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => navigate(item.to)}
                    className="flex w-full items-center justify-between px-[6px] py-[10px]"
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="font-infoma text-base leading-4 tracking-[-0.32px] text-black">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-black" />
                  </button>

                  {index < section.items.length - 1 && (
                    <div className="mx-[18px] h-px bg-[#E1E0DF]" />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      <div className="overflow-hidden rounded-[2px] border border-[#E1E0DF] bg-white">
        {/* <Button
          onClick={handleSignOut}
          className="h-11 w-full bg-[#18100C] text-white hover:bg-[#2A201B]"
        >
          Log out
        </Button> */}
        <div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center justify-between px-[8px] py-[10px]"
                  >
                    <div className="flex items-center gap-2 ">
                      <LogOut className="h-5 w-5 text-black" />
                      <span className="font-infoma text-base leading-4 tracking-[-0.32px] text-black">
                        Log out
                      </span>
                     </div>
                     <div>
                      <ChevronRight className="h-5 w-5 text-black" />
                    </div>
                  </button>
                </div>
         </div>
      </main>
    </div>
  );
}
