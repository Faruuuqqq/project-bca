export type DashboardRange = 'today' | '7d' | '30d' | 'mtd'

export const DASHBOARD_RANGES: { value: DashboardRange; label: string }[] = [
  { value: 'today', label: 'Hari Ini' },
  { value: '7d', label: '7 Hari' },
  { value: '30d', label: '30 Hari' },
  { value: 'mtd', label: 'Bulan Ini' },
]

export type FinancialStats = {
  revenue: number
  revenueDelta: number | null
  orders: number
  ordersDelta: number | null
  aov: number
  aovDelta: number | null
  inventoryValue: number
  grossProfit: number
  grossMarginPct: number
}

export type OperationsStats = {
  dineIn: number
  takeaway: number
  hourlyData: Array<{ hour: string; orders: number }>
}

export type WeeklyChartPoint = { day: string; total: number }

export type InventoryAlert = {
  id: string
  name: string
  current_stock: number
}

export type Bestseller = {
  name: string
  qty: number
}

export type PaymentStats = {
  qris: number
  cash: number
}

export type DashboardStats = {
  range: DashboardRange
  financials: FinancialStats
  operations: OperationsStats
  weeklyChartData: WeeklyChartPoint[]
  inventoryAlerts: InventoryAlert[]
  bestsellers: Bestseller[]
  paymentStats: PaymentStats
}
