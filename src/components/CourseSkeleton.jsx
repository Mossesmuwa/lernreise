function Bar({ className }) {
  return <div className={`bg-mist/60 rounded animate-pulse ${className}`} />;
}

export default function CourseSkeleton() {
  return (
    <div
      className="p-4 md:p-0 max-w-md md:max-w-none mx-auto space-y-3"
      aria-hidden="true"
    >
      <Bar className="h-6 w-20 mb-2" />
      <Bar className="h-14 w-full rounded-xl" />
      <Bar className="h-40 w-full rounded-xl" />
      <Bar className="h-14 w-full rounded-xl" />
      <Bar className="h-14 w-full rounded-xl" />
    </div>
  );
}
