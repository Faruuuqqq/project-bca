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
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-3">
        {/* COOK QUEUE (Skeleton) */}
        <section className="lg:col-span-2 space-y-2 lg:space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[200px]">
                <div className="bg-brand-primary/10 px-3 py-2 flex justify-between items-center">
                  <div className="space-y-1">
                    <Skeleton className="h-2 w-10" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-1 items-end flex flex-col">
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                </div>
                <div className="p-3 space-y-3 flex-1 flex flex-col">
                  <div className="flex justify-between border-b border-border pb-1.5">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="space-y-2 flex-1">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Skeleton key={j} className="h-3 w-full" />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-12 rounded-xl shrink-0" />
                    <Skeleton className="h-10 flex-1 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* READY QUEUE (Skeleton) */}
        <section className="space-y-2 lg:space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-emerald-50/40 border border-emerald-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[180px]">
                <div className="bg-emerald-600/20 px-3 py-2 flex justify-between items-center">
                  <div className="space-y-1">
                    <Skeleton className="h-2 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <div className="p-3 space-y-3 flex-1 flex flex-col">
                  <div className="flex justify-between border-b border-emerald-200/60 pb-1.5">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="space-y-2 flex-1">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <Skeleton key={j} className="h-3 w-full" />
                    ))}
                  </div>
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
