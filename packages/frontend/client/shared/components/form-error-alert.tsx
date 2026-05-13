interface Props {
  message: string;
  detail?: string;
}

export function FormErrorAlert({ message, detail }: Props) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
      <p>{message}</p>
      {detail && (
        <p className="mt-1 font-mono text-[11px] opacity-70">{detail}</p>
      )}
    </div>
  );
}
