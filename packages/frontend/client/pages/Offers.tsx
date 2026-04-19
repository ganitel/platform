import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Gift } from "lucide-react";

export default function Offers() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ganitel-background-primary flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header with back button and title */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-ganitel-text-title flex items-center gap-2">
            <Gift className="h-6 w-6" />
            Offers
          </h1>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Offres spéciales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-ganitel-text-label">
              Découvrez nos offres exclusives et promotions spéciales.
            </p>
            <p className="text-ganitel-text-label">
              Cette section sera bientôt disponible avec des offres personnalisées.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}