export function ActionMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-amber-800" data-testid="action-message">
      {message}
    </p>
  );
}
