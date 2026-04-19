import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ArrowLeft, HelpCircle } from "lucide-react";

export default function Help() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:w-[360px] mx-auto pb-24">
      <Header />

      {/* Secondary header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button
          onClick={() => navigate("/profile")}
          className="text-gray-700 hover:text-gray-900 transition"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">Centre d'aide</h2>
        <div className="w-5" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-gray-700" />
            <p className="font-bold text-gray-900">Centre d'aide</p>
          </div>
          <p className="text-sm text-gray-500">Besoin d'aide ? Contactez notre équipe de support.</p>
          <p className="text-sm text-gray-700 font-medium">Email: support@ganitel.com</p>
        </div>
      </div>
    </div>
  );
}