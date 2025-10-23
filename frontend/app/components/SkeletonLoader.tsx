interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: Readonly<SkeletonProps>) {
  return (
    <div 
      className={`animate-pulse bg-white/10 rounded ${className}`}
      aria-label="Loading..."
    />
  );
}

export function ChatListSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={`skeleton-${i}`} className="p-3 rounded-lg bg-white/5 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

export function ChatSidebarSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* Header skeleton */}
      <div className="p-4 border-b border-white/10">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      
      {/* Search skeleton */}
      <div className="p-4">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      
      {/* Chat list skeleton */}
      <ChatListSkeleton />
    </div>
  );
}
