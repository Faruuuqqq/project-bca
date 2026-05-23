import { getPaymentHistory, getPaymentStatistics } from '@/actions/admin'
import PaymentHistoryPage from '@/components/admin/PaymentHistoryPage'

const ITEMS_PER_PAGE = 20

export default async function PaymentHistoryRoute({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; method?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const offset = (page - 1) * ITEMS_PER_PAGE

  const { payments, total } = await getPaymentHistory(ITEMS_PER_PAGE, offset)
  const stats = await getPaymentStatistics(params.from, params.to)
  const totalPages = Math.ceil((total || 0) / ITEMS_PER_PAGE)

  return (
    <PaymentHistoryPage
      initialPayments={payments || []}
      currentPage={page}
      totalPages={totalPages}
      totalPayments={total || 0}
      stats={stats}
      methodFilter={params.method}
      dateFrom={params.from}
      dateTo={params.to}
    />
  )
}
