export const SHARED_INVENTORY_GROUPS = [
  ['Ayam Geprek', 'Paket Nasi Ayam Geprek', 'Crispy Fried Chicken'],
  ['Ayam Kremes', 'Ayam Serundeng', 'Ayam Penyet', 'Paket Ayam Kremes', 'Paket Nasi Ayam Serundeng', 'Paket Nasi Ayam Penyet']
]

export function getSharedMenuIds(menuName: string, allMenus: { id: string, name: string }[]): string[] {
  const group = SHARED_INVENTORY_GROUPS.find(g => g.includes(menuName))
  if (!group) return [allMenus.find(m => m.name === menuName)?.id].filter(Boolean) as string[]
  return allMenus.filter(m => group.includes(m.name)).map(m => m.id)
}
