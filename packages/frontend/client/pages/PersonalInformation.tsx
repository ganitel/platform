import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useProfile } from "@/hooks/useProfile";
import { Loader2, ArrowLeft, Edit, Mail, Phone, MapPin, User } from "lucide-react";

export default function PersonalInformation() {
  const navigate = useNavigate();
  const { data: profile, isLoading, isError, refetch } = useProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:w-[360px] mx-auto">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:w-[360px] mx-auto">
        <Header />
        <div className="flex-1 px-4 py-6">
          <div className="bg-white rounded-xl p-4 space-y-3">
            <p className="font-bold text-gray-900">Unable to load your information</p>
            <div className="flex gap-2">
              <button onClick={() => refetch()} className="flex-1 border border-gray-300 rounded-xl py-2 text-sm font-medium">Retry</button>
              <button onClick={() => navigate("/profile")} className="flex-1 bg-gray-100 rounded-xl py-2 text-sm font-medium">Back</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fields = [
    { label: "First name", value: profile.first_name || "—", icon: <User className="h-3.5 w-3.5 text-gray-500" /> },
    { label: "Name", value: profile.last_name || "—", icon: <User className="h-3.5 w-3.5 text-gray-500" /> },
    { label: "Mail", value: profile.email, icon: <Mail className="h-3.5 w-3.5 text-gray-500" /> },
    { label: "WhatsApp number", value: profile.phone || "—", icon: <Phone className="h-3.5 w-3.5 text-gray-500" /> },
    { label: "Location", value: [profile.city, profile.country].filter(Boolean).join(", ") || "—", icon: <MapPin className="h-3.5 w-3.5 text-gray-500" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:w-[360px] mx-auto pb-24">
      <Header />

      {/* Secondary header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate("/profile")} className="text-gray-700 hover:text-gray-900 transition" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">Personal information</h2>
        <div className="w-5" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Fields */}
        <div className="space-y-3">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex items-center justify-between px-4 py-3.5 rounded-xl"
              style={{ backgroundColor: "#E1E0DF" }}
            >
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">{field.label}</p>
                <div className="flex items-center gap-2">
                  <div className="bg-white rounded-full p-1 flex-shrink-0">
                    {field.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{field.value}</p>
                </div>
              </div>
              <div
                className="ml-3 p-2 rounded-lg cursor-pointer transition bg-white"
                onClick={() => navigate("/profile/personal-information/edit", { state: { profile } })}
                aria-label={`Edit ${field.label}`}
              >
                <Edit className="h-3.5 w-3.5 text-gray-600" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
