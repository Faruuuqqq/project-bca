import { Suspense } from 'react'
import { getTopSellingMenus } from '@/actions/admin/payments'
import MenuSalesHistoryPage from '@/components/admin/MenuSalesHistoryPage'
import SalesHistoryLoading from './loading'

async function SalesHistoryContent({
  days,
  sort,
}: {
  days: number
  sort: string
}) {
  const sales = await getTopSellingMenus(days, 50)

  return (
    <MenuSalesHistoryPage
      initialSales={sales}
      days={days}
      sortBy={sort}
    />
  )
}

export default async function SalesHistoryRoute({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; sort?: string }>
}) {
  const params = await searchParams
  const days = Math.max(1, parseInt(params.days || '30', 10))
  const sort = params.sort || 'revenue'

  return (
    <Suspense fallback={<SalesHistoryLoading />}>
      <SalesHistoryContent days={days} sort={sort} />
    </Suspense>
  )
}
