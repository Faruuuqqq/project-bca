'use client'

import { getDashboardStats } from '@/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Banknote, ShoppingBag, TrendingUp, Award, QrCode, Wallet } from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts'

export default function DashboardClient({ stats }: { stats: any }) {
  const COLORS = ['#d42c2c', '#3d2b1f', '#7a5c48', '#f8f1e7', '#zinc-300']
  
  const paymentPieData = [
    { name: 'QRIS', value: stats.paymentStats.qris },
    { name: 'Tunai', value: stats.paymentStats.cash },
  ]

  return (
    <div className="p-8 space-y-8 bg-zinc-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-[#3d2b1f] tracking-tight">Analitik Bisnis</h2>
          <p className="text-zinc-500 font-medium mt-1">Laporan performa Ayam Kalintang periode berjalan.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border font-bold text-[#3d2b1f]">
          {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="h-1 bg-[#d42c2c]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Omzet Hari Ini</span>
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-[#d42c2c]">
              <Banknote size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#3d2b1f]">
              Rp {new Intl.NumberFormat('id-ID').format(stats.totalRevenueToday)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-green-600 font-bold text-xs">
              <TrendingUp size={12} /> +8.4%
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="h-1 bg-[#3d2b1f]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Pesanan</span>
            <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-[#3d2b1f]">
              <ShoppingBag size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#3d2b1f]">{stats.totalOrdersToday}</div>
            <div className="mt-2 text-zinc-400 font-medium text-xs">Transaksi sukses</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="h-1 bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Metode QRIS</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <QrCode size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#3d2b1f]">{stats.paymentStats.qris}</div>
            <div className="mt-2 text-zinc-400 font-medium text-xs">Otomatis Terverifikasi</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="h-1 bg-green-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Metode Tunai</span>
            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
              <Wallet size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#3d2b1f]">{stats.paymentStats.cash}</div>
            <div className="mt-2 text-zinc-400 font-medium text-xs">Dikonfirmasi Kasir</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-none shadow-xl bg-white rounded-3xl p-6">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-lg font-black text-[#3d2b1f] uppercase tracking-tight">Tren Penjualan (7 Hari Terakhir)</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                <div className="h-2 w-2 rounded-full bg-[#d42c2c]" /> Pendapatan
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickFormatter={(val) => `Rp ${val / 1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8f1e7' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#d42c2c" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bestsellers List */}
        <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-8 px-2">
            <Award className="text-orange-500" />
            <h3 className="text-lg font-black text-[#3d2b1f] uppercase tracking-tight">Menu Terlaris</h3>
          </div>
          <div className="flex-1 space-y-6">
            {stats.bestsellers.map((item: any, idx: number) => (
              <div key={item.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center font-black text-zinc-400 group-hover:bg-[#d42c2c] group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-[#3d2b1f] text-sm">{item.name}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{item.qty} Porsi Terjual</p>
                  </div>
                </div>
                <div className="h-2 w-24 bg-zinc-100 rounded-full overflow-hidden hidden sm:block">
                  <div 
                    className="h-full bg-[#d42c2c]" 
                    style={{ width: `${(item.qty / stats.bestsellers[0].qty) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
