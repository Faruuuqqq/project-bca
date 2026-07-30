/**
 * Pure synchronous utility to check if an order is a test order
 */
export function checkIsTestOrder(
  order: { id: string; customer_name?: string | null },
  testIdsSet: Set<string>
): boolean {
  if (testIdsSet.has(order.id)) return true
  if (order.customer_name && order.customer_name.includes('[TEST]')) return true
  return false
}
