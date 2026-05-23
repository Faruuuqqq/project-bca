import { getTopSellingMenus } from '@/actions/admin'
import MenuSalesHistoryPage from '@/components/admin/MenuSalesHistoryPage'

export default async function SalesHistoryRoute({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; sort?: string }>
}) {
  const params = await searchParams
  const days = Math.max(1, parseInt(params.days || '30', 10))
  const sort = params.sort || 'revenue'

  const sales = await getTopSellingMenus(days, 50)

  return (
    <MenuSalesHistoryPage
      initialSales={sales}
      days={days}
      sortBy={sort}
    />
  )
}
