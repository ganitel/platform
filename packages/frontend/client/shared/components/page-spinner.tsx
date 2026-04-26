export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <span
        className="size-8 animate-spin rounded-full border-2 border-ganitel-stroke-neutral border-t-ganitel-primary"
        aria-label="Loading"
        role="status"
      />
    </div>
  );
}
