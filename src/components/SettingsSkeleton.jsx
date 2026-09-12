function Bar({ className }) {
  return <div className={`bg-mist/60 rounded animate-pulse ${className}`} />;
}

export default function SettingsSkeleton() {
  return (
    <div
      className="p-4 md:p-0 max-w-md md:max-w-none mx-auto space-y-6"
      aria-hidden="true"
    >
      <Bar className="h-6 w-24" />
      <Bar className="h-28 w-full rounded-xl" />
      <Bar className="h-24 w-full rounded-xl" />
      <Bar className="h-12 w-full rounded-xl" />
      <Bar className="h-12 w-full rounded-xl" />
    </div>
  );
}

