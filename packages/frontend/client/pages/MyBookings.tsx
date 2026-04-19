import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function MyBookings() {
  return (
    <div className="min-h-screen bg-ganitel-background-primary flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Mes réservations</h1>
        <p className="text-ganitel-text-label mt-4">Cette page est en cours de développement.</p>
      </main>
      <Footer />
    </div>
  );
}