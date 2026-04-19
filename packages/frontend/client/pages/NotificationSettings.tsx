import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MessageSquare, Mail } from "lucide-react";

export default function NotificationSettings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    whatsapp: true,
    email: true,
    booking: true,
    wishlist: false,
    message: true,
    securityAndAccount: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:w-[360px] mx-auto pb-24">
      <style>{`
        [data-state="checked"].notification-switch { background-color: #D39E70 !important; }
      `}</style>

      <Header />

      {/* Secondary header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate("/profile")} className="text-gray-700 hover:text-gray-900 transition" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">Notifications</h2>
        <div className="w-5" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Reception channels */}
        <div className="bg-white rounded-xl p-4 space-y-4">
          <p className="font-bold text-gray-900">Reception channels</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <Label className="text-base">WhatsApp</Label>
            </div>
            <Switch className="notification-switch" checked={settings.whatsapp} onCheckedChange={() => handleToggle('whatsapp')} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5" />
              <Label className="text-base">Email</Label>
            </div>
            <Switch className="notification-switch" checked={settings.email} onCheckedChange={() => handleToggle('email')} />
          </div>
        </div>

        {/* Notification types */}
        <div className="bg-white rounded-xl p-4 space-y-4">
          <p className="font-bold text-gray-900">Notification types</p>
          <div className="flex items-center justify-between">
            <Label className="text-base">Booking</Label>
            <Switch className="notification-switch" checked={settings.booking} onCheckedChange={() => handleToggle('booking')} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-base">Wishlist</Label>
            <Switch className="notification-switch" checked={settings.wishlist} onCheckedChange={() => handleToggle('wishlist')} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-base">Message</Label>
            <Switch className="notification-switch" checked={settings.message} onCheckedChange={() => handleToggle('message')} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-base">Security & account</Label>
            <Switch className="notification-switch" checked={settings.securityAndAccount} onCheckedChange={() => handleToggle('securityAndAccount')} />
          </div>
        </div>
      </div>
    </div>
  );
}
