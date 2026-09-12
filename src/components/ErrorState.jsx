export default function ErrorState({
  title = "Something went wrong",
  description = "This may be temporary.",
  onRetry,
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/60 px-6 py-10 text-center">
      <p className="font-display text-lg text-red-950">{title}</p>
      <p className="text-sm text-red-900/70 mt-1">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-sm font-medium text-pine underline underline-offset-4"
        >
          Try again
        </button>
      )}
    </div>
  );
}
