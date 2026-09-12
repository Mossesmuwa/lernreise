function Bar({ className }) {
  return <div className={`bg-mist/60 rounded animate-pulse ${className}`} />;
}

export default function HistorySkeleton() {
  return (
    <div
      className="p-4 md:p-0 max-w-md md:max-w-none mx-auto space-y-4"
      aria-hidden="true"
    >
      <Bar className="h-6 w-24" />
      <Bar className="h-10 w-full rounded-lg" />
      <div className="flex gap-2">
        <Bar className="h-7 w-12 rounded-lg" />
        <Bar className="h-7 w-16 rounded-lg" />
        <Bar className="h-7 w-16 rounded-lg" />
      </div>
      <Bar className="h-4 w-20" />
      <Bar className="h-10 w-full rounded" />
      <Bar className="h-10 w-full rounded" />
      <Bar className="h-4 w-20" />
      <Bar className="h-10 w-full rounded" />
    </div>
  );
}
