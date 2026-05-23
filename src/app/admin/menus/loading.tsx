import { Skeleton } from '@/components/ui/skeleton'

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="bg-muted/40 px-6 py-3 flex gap-4 border-b border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-6 py-3.5 flex items-center gap-4 border-b border-border last:border-b-0"
        >
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-20 rounded-md ml-auto" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export default function MenusLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <TableSkeleton rows={6} />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <TableSkeleton rows={4} />
    </div>
  )
}
