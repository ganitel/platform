import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Mail, User, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUpdateProfile, useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { COUNTRY_CODES } from "@/lib/countryCodes";

export default function EditPersonalInformation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const src = location.state?.profile || profile;

  // Extract country code and local number from stored phone
  const extractPhone = (phone: string) => {
    if (!phone) return { countryCode: "+237", localNumber: "" };
    const matched = COUNTRY_CODES.find((c) => phone.startsWith(c.code));
    if (matched) return { countryCode: matched.code, localNumber: phone.substring(matched.code.length) };
    return { countryCode: "+237", localNumber: phone };
  };

  const { countryCode: initCode, localNumber: initLocal } = extractPhone(src?.phone ?? "");

  const [form, setForm] = useState({
    first_name: src?.first_name ?? "",
    last_name: src?.last_name ?? "",
    countryCode: initCode,
    localNumber: initLocal,
    city: src?.city ?? "",
    country: src?.country ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.first_name.trim() || form.first_name.trim().length < 2) e.first_name = "At least 2 characters";
    if (!form.last_name.trim() || form.last_name.trim().length < 2) e.last_name = "At least 2 characters";
    if (form.localNumber && !/^\d{6,15}$/.test(form.localNumber)) e.localNumber = "6-15 digits only";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      await updateProfile.mutateAsync({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.localNumber ? `${form.countryCode}${form.localNumber}` : "",
        city: form.city,
        country: form.country,
      });
      toast({ title: "Profile updated" });
      navigate("/profile/personal-information");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Could not update profile.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:w-[360px] mx-auto pb-24">
      {/* Secondary header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="text-gray-700 hover:text-gray-900 transition" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">Edit information</h2>
        <div className="w-5" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl p-4 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Your Information
          </h2>

          {/* First Name */}
          <div>
            <label className="text-sm font-medium text-gray-900">First Name *</label>
            <Input
              type="text"
              value={form.first_name}
              onChange={set("first_name")}
              placeholder="John"
              className={`mt-1 ${errors.first_name ? "border-red-500" : ""}`}
              style={{ backgroundColor: "#F6F5F5" }}
            />
            {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label className="text-sm font-medium text-gray-900">Last Name *</label>
            <Input
              type="text"
              value={form.last_name}
              onChange={set("last_name")}
              placeholder="Doe"
              className={`mt-1 ${errors.last_name ? "border-red-500" : ""}`}
              style={{ backgroundColor: "#F6F5F5" }}
            />
            {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
          </div>

          {/* Email — read only */}
          <div>
            <label className="text-sm font-medium text-gray-900">Email *</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
              <Input
                type="email"
                value={src?.email ?? ""}
                readOnly
                placeholder="email@example.com"
                className="pl-10 cursor-not-allowed text-gray-400"
                style={{ backgroundColor: "#F6F5F5" }}
              />
            </div>
          </div>

          {/* WhatsApp Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">WhatsApp Number *</label>
            <div className="flex gap-2">
              {/* Country code select */}
              <div className="relative flex-shrink-0">
                <select
                  value={form.countryCode}
                  onChange={set("countryCode")}
                  className="appearance-none px-3 py-2.5 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white cursor-pointer"
                  style={{ width: "110px", color: "transparent", textShadow: "0 0 0 transparent" }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} style={{ color: "black" }}>
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center gap-1">
                  <span className="text-2xl">{COUNTRY_CODES.find((c) => c.code === form.countryCode)?.flag}</span>
                  <span className="text-sm font-medium text-gray-900">{COUNTRY_CODES.find((c) => c.code === form.countryCode)?.code}</span>
                </div>
              </div>

              {/* Local number */}
              <Input
                type="tel"
                value={form.localNumber}
                onChange={set("localNumber")}
                placeholder="612345678"
                className={`flex-1 ${errors.localNumber ? "border-red-500" : ""}`}
                style={{ backgroundColor: "#F6F5F5" }}
              />
            </div>
            {form.localNumber && !errors.localNumber && (
              <p className="text-xs text-gray-600">Format: {form.countryCode} {form.localNumber}</p>
            )}
            {errors.localNumber && <p className="text-red-500 text-xs">{errors.localNumber}</p>}
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="fixed bottom-6 left-4 right-4 md:max-w-[328px] md:mx-auto">
        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3"
        >
          {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
