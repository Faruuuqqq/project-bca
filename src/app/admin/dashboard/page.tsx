import { Suspense } from 'react'
import { getDashboardStats } from '@/actions/admin/analytics'
import DashboardClient from '@/components/admin/DashboardClient'
import DashboardLoading from './loading'
import type { DashboardRange } from '@/types/dashboard'

const VALID_RANGES: DashboardRange[] = ['today', '7d', '30d', 'mtd']

function parseRange(input: string | string[] | undefined): DashboardRange {
  if (typeof input !== 'string') return 'today'
  return (VALID_RANGES as string[]).includes(input)
    ? (input as DashboardRange)
    : 'today'
}

async function DashboardContent({
  range,
}: {
  range: DashboardRange
}) {
  const stats = await getDashboardStats(range)
  return <DashboardClient stats={stats} />
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>
}) {
  const params = await searchParams
  const range = parseRange(params.range)

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent range={range} />
    </Suspense>
  )
}
