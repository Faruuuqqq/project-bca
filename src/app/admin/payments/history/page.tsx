import { Suspense } from 'react'
import { getPaymentHistory, getPaymentStatistics } from '@/actions/admin/payments'
import PaymentHistoryPage from '@/components/admin/PaymentHistoryPage'
import PaymentHistoryLoading from './loading'

const ITEMS_PER_PAGE = 20

async function PaymentHistoryContent({
  page,
  method,
  from,
  to,
}: {
  page: number
  method?: string
  from?: string
  to?: string
}) {
  const offset = (page - 1) * ITEMS_PER_PAGE

  // Parallel fetch: payment history + statistics
  const [{ payments, total }, stats] = await Promise.all([
    getPaymentHistory(ITEMS_PER_PAGE, offset),
    getPaymentStatistics(from, to),
  ])
  const totalPages = Math.ceil((total || 0) / ITEMS_PER_PAGE)

  return (
    <PaymentHistoryPage
      initialPayments={payments || []}
      currentPage={page}
      totalPages={totalPages}
      totalPayments={total || 0}
      stats={stats}
      methodFilter={method}
      dateFrom={from}
      dateTo={to}
    />
  )
}

export default async function PaymentHistoryRoute({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; method?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))

  return (
    <Suspense fallback={<PaymentHistoryLoading />}>
      <PaymentHistoryContent
        page={page}
        method={params.method}
        from={params.from}
        to={params.to}
      />
    </Suspense>
  )
}
