import { createClient } from '@/lib/supabase/server'
import { OrderBoard } from '@/components/admin/OrderBoard'
import { Button } from '@/components/ui/button'
import { LogOut, LayoutDashboard, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch initial orders for today that are not completed
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .neq('order_status', 'completed')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      <header className="bg-white border-b px-8 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-black text-[#d42c2c] tracking-tighter flex items-center gap-2">
              <UtensilsCrossed size={24} />
              AYAM KALINTANG <span className="text-zinc-400 font-medium">ADMIN</span>
            </h1>
            <nav className="hidden md:flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" className="text-[#d42c2c] bg-[#d42c2c]/5 font-bold">
                  <LayoutDashboard size={18} className="mr-2" />
                  Pesanan
                </Button>
              </Link>
              <Link href="/admin/menu">
                <Button variant="ghost" className="text-zinc-500 font-medium">
                  Stok Menu
                </Button>
              </Link>
            </nav>
          </div>
          <form action="/auth/signout" method="post">
            <Button variant="ghost" type="submit" className="text-zinc-400 hover:text-red-500">
              <LogOut size={18} className="mr-2" />
              Keluar
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8">
        <OrderBoard initialOrders={orders || []} />
      </main>
    </div>
  )
}
