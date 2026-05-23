import { Skeleton } from '@/components/ui/skeleton'

function StockTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="bg-muted/40 px-6 py-3 flex gap-4 border-b border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-24" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-6 py-3.5 flex items-center gap-4 border-b border-border last:border-b-0"
        >
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-5 w-20 rounded-md ml-auto" />
        </div>
      ))}
    </div>
  )
}

export default function InventoryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-56 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <StockTableSkeleton rows={6} />
      <Skeleton className="h-5 w-48" />
      <StockTableSkeleton rows={5} />
    </div>
  )
}
