export function MyBookingsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <h1 className="font-infoma text-3xl text-ganitel-text-title">Mes réservations</h1>
      <p className="mt-3 text-sm text-ganitel-text-subtitle">
        Cette page sera reliée à <code>GET /api/bookings/me</code> lors de la prochaine itération.
      </p>
    </div>
  );
}
