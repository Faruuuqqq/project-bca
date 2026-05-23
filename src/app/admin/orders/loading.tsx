import { Skeleton } from '@/components/ui/skeleton'

export default function OrdersLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Order grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col"
          >
            <div className="bg-brand-primary/10 px-4 py-3 flex justify-between items-center">
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="h-7 w-16" />
              </div>
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between border-b border-border pb-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
