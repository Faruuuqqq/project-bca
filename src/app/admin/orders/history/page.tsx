import { getOrdersHistory } from '@/actions/admin'
import OrdersHistoryPage from '@/components/admin/OrdersHistoryPage'

const ITEMS_PER_PAGE = 20

export default async function OrdersHistoryRoute({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const offset = (page - 1) * ITEMS_PER_PAGE

  const { orders, total } = await getOrdersHistory(ITEMS_PER_PAGE, offset)
  const totalPages = Math.ceil((total || 0) / ITEMS_PER_PAGE)

  return (
    <OrdersHistoryPage
      initialOrders={orders || []}
      currentPage={page}
      totalPages={totalPages}
      totalOrders={total || 0}
      searchQuery={params.search}
      statusFilter={params.status}
      dateFrom={params.from}
      dateTo={params.to}
    />
  )
}
