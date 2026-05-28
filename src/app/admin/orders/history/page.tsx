import { Suspense } from 'react'
import { getOrdersHistory } from '@/actions/admin/orders'
import OrdersHistoryPage from '@/components/admin/OrdersHistoryPage'
import OrdersHistoryLoading from './loading'

const ITEMS_PER_PAGE = 20

async function OrdersHistoryContent({
  page,
  search,
  status,
  from,
  to,
}: {
  page: number
  search?: string
  status?: string
  from?: string
  to?: string
}) {
  const offset = (page - 1) * ITEMS_PER_PAGE
  const { orders, total } = await getOrdersHistory(ITEMS_PER_PAGE, offset)
  const totalPages = Math.ceil((total || 0) / ITEMS_PER_PAGE)

  return (
    <OrdersHistoryPage
      initialOrders={orders || []}
      currentPage={page}
      totalPages={totalPages}
      totalOrders={total || 0}
      searchQuery={search}
      statusFilter={status}
      dateFrom={from}
      dateTo={to}
    />
  )
}

export default async function OrdersHistoryRoute({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))

  return (
    <Suspense fallback={<OrdersHistoryLoading />}>
      <OrdersHistoryContent
        page={page}
        search={params.search}
        status={params.status}
        from={params.from}
        to={params.to}
      />
    </Suspense>
  )
}
