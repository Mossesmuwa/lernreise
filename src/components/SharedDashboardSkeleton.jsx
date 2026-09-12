function Bar({ className }) {
  return <div className={`bg-mist/60 rounded animate-pulse ${className}`} />;
}

export default function SharedDashboardSkeleton() {
  return (
    <div className="p-4 max-w-md mx-auto space-y-5" aria-hidden="true">
      <Bar className="h-8 w-full rounded-lg" />
      <Bar className="h-6 w-2/3" />
      <Bar className="h-16 w-full rounded-lg" />
      <Bar className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-2">
        <Bar className="h-14 rounded-lg" />
        <Bar className="h-14 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Bar className="h-4 w-24" />
        <Bar className="h-10 w-full rounded-lg" />
        <Bar className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
