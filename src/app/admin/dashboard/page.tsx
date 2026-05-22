import { getDashboardStats } from '@/actions/admin'
import DashboardClient from '@/components/admin/DashboardClient'

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return <DashboardClient stats={stats} />
}
