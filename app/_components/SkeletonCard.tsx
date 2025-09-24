export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-neutral-900/50 p-4 shadow">
      <div className="h-48 w-full rounded-xl bg-neutral-800 mb-3"></div>
      <div className="h-4 w-3/4 bg-neutral-800 rounded mb-2"></div>
      <div className="h-3 w-1/2 bg-neutral-800 rounded"></div>
    </div>
  );
}
