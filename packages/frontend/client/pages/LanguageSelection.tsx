import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Globe } from "lucide-react";

export default function LanguageSelection() {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('fr');
  const [automaticLanguage, setAutomaticLanguage] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:w-[360px] mx-auto pb-24">
      <style>{`
        [data-state="checked"].lang-switch { background-color: #D39E70 !important; }
        [data-state="checked"].lang-checkbox { background-color: #D39E70 !important; border-color: #D39E70 !important; }
      `}</style>

      <Header />

      {/* Secondary header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate("/profile")} className="text-gray-700 hover:text-gray-900 transition" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">Language</h2>
        <div className="w-5" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Description */}
        <div className="bg-white rounded-xl p-4 text-center space-y-1">
          <p className="font-semibold text-gray-900">Choose the app language</p>
          <p className="text-sm text-gray-500">Content and suggestions based on your region</p>
        </div>

        {/* Language Selection */}
        <div className="bg-white rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-gray-700" />
            <p className="font-bold text-gray-900">Available languages</p>
          </div>
          <div className={`flex items-center space-x-3 ${automaticLanguage ? 'opacity-40 pointer-events-none' : ''}`}>
            <input
              type="radio"
              id="fr"
              name="language"
              value="fr"
              checked={selectedLanguage === 'fr'}
              onChange={() => setSelectedLanguage('fr')}
              disabled={automaticLanguage}
              className="w-4 h-4 accent-[#D39E70] cursor-pointer"
            />
            <Label htmlFor="fr" className="flex items-center gap-3 cursor-pointer flex-1">
              <span className="text-lg">🇫🇷</span>
              <span className="font-medium">French</span>
            </Label>
          </div>
          <div className={`flex items-center space-x-3 ${automaticLanguage ? 'opacity-40 pointer-events-none' : ''}`}>
            <input
              type="radio"
              id="en"
              name="language"
              value="en"
              checked={selectedLanguage === 'en'}
              onChange={() => setSelectedLanguage('en')}
              disabled={automaticLanguage}
              className="w-4 h-4 accent-[#D39E70] cursor-pointer"
            />
            <Label htmlFor="en" className="flex items-center gap-3 cursor-pointer flex-1">
              <span className="text-lg">🇬🇧</span>
              <span className="font-medium">English</span>
            </Label>
          </div>
        </div>

        {/* Automatic Language */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Automatic language</Label>
              <p className="text-sm text-gray-500">Set language based on your device settings.</p>
            </div>
            <Switch className="lang-switch" checked={automaticLanguage} onCheckedChange={setAutomaticLanguage} />
          </div>
        </div>
      </div>
    </div>
  );
}
