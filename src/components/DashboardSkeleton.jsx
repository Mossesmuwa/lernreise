function Bar({ className }) {
  return <div className={`bg-mist/60 rounded animate-pulse ${className}`} />;
}

export default function DashboardSkeleton() {
  return (
    <div
      className="p-4 md:p-0 max-w-md md:max-w-none mx-auto space-y-5"
      aria-hidden="true"
    >
      <Bar className="h-6 w-40" />
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bar key={i} className="h-12 flex-1 rounded-lg" />
        ))}
      </div>
      <Bar className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bar key={i} className="h-14 rounded-lg" />
        ))}
      </div>
      <Bar className="h-4 w-16" />
      <Bar className="h-10 w-full rounded-lg" />
      <Bar className="h-10 w-full rounded-lg" />
    </div>
  );
}
