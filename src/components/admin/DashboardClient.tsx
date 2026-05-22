'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { 
  Banknote, 
  ShoppingBag, 
  TrendingUp, 
  Award, 
  QrCode, 
  Wallet, 
  Calendar, 
  TrendingDown, 
  Zap,
  LayoutGrid,
  Coins,
  Warehouse
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { Badge } from '@/components/ui/badge'

export default function DashboardClient({ stats }: { stats: any }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Brand Focused Colors
  const COLORS = {
    primary: '#0667AC',
    secondary: '#FEB914',
    tertiary: '#9C4F00',
    neutral: '#74777D',
    success: '#16a34a',
    danger: '#dc2626'
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 -mt-4 md:-mt-6">
      {/* 1. HEADER: Minimal Info Bar */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-[#3d2b1f] uppercase tracking-tighter">
                Ringkasan Bisnis
              </h3>
              <Badge className="bg-brand-primary text-white text-[9px] px-2 py-0 rounded-md font-black shadow-sm">
                LIVE
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
               <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
               <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Operational Pulse Analytics</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
           <div className="hidden md:flex flex-col text-right pr-4 border-r border-zinc-200">
              <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest leading-none mb-1">Tanggal</p>
              <p className="text-[10px] font-black text-brand-primary uppercase tabular-nums">
                {mounted ? new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '...'}
              </p>
           </div>
           <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border shadow-sm">
              <Calendar size={14} className="text-zinc-400" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Realtime Data</span>
           </div>
        </div>
      </div>

      {/* 2. CORE FINANCIALS: The Owner's Bottom Line */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Revenue Card */}
        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-500">
          <div className="h-2 bg-brand-primary" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-7">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Total Pendapatan</span>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-brand-primary shadow-inner">
              <Banknote size={24} />
            </div>
          </CardHeader>
          <CardContent className="p-7 pt-0">
            <div className="text-3xl font-black text-[#3d2b1f] tracking-tighter leading-none">
              Rp {new Intl.NumberFormat('id-ID').format(stats.financials.revenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-green-600 font-black text-[10px] uppercase tracking-widest bg-green-50 w-fit px-3 py-1 rounded-full border border-green-100">
              <TrendingUp size={12} strokeWidth={3} /> Realtime
            </div>
          </CardContent>
        </Card>

        {/* Estimated Gross Profit - Critical for Owners */}
        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-500">
          <div className="h-2 bg-green-600" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-7">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Est. Laba Kotor (65%)</span>
            <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shadow-inner">
              <Coins size={24} />
            </div>
          </CardHeader>
          <CardContent className="p-7 pt-0">
            <div className="text-3xl font-black text-[#3d2b1f] tracking-tighter leading-none">
              Rp {new Intl.NumberFormat('id-ID').format(stats.financials.estGrossProfit)}
            </div>
            <p className="mt-4 text-zinc-400 font-bold text-[10px] uppercase tracking-widest leading-none">Margin Operasional</p>
          </CardContent>
        </Card>

        {/* Inventory Asset Value */}
        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-500">
          <div className="h-2 bg-brand-secondary" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-7">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Nilai Aset Stok</span>
            <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-brand-secondary shadow-inner">
              <Warehouse size={24} />
            </div>
          </CardHeader>
          <CardContent className="p-7 pt-0">
            <div className="text-3xl font-black text-[#3d2b1f] tracking-tighter leading-none">
              Rp {new Intl.NumberFormat('id-ID').format(stats.financials.inventoryValue)}
            </div>
            <p className="mt-4 text-zinc-400 font-bold text-[10px] uppercase tracking-widest leading-none">Modal di Gudang</p>
          </CardContent>
        </Card>

        {/* Average Order Value (AOV) */}
        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-500">
          <div className="h-2 bg-[#9C4F00]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-7">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Rata-rata Keranjang</span>
            <div className="h-12 w-12 rounded-2xl bg-orange-50/50 flex items-center justify-center text-[#9C4F00] shadow-inner">
              <Zap size={24} />
            </div>
          </CardHeader>
          <CardContent className="p-7 pt-0">
            <div className="text-3xl font-black text-[#3d2b1f] tracking-tighter leading-none">
              Rp {new Intl.NumberFormat('id-ID').format(stats.financials.aov)}
            </div>
            <p className="mt-4 text-zinc-400 font-bold text-[10px] uppercase tracking-widest leading-none">Performa Upselling</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 3. PEAK HOUR ANALYSIS: Operational Efficiency */}
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white rounded-[3rem] p-10 border border-white relative overflow-hidden">
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-[#3d2b1f] uppercase tracking-tight">Analisis Jam Sibuk</h3>
              <p className="text-xs text-zinc-400 font-black uppercase tracking-[0.2em]">Kepadatan Pelanggan Per Hari</p>
            </div>
            <Badge className="bg-blue-50 text-brand-primary border-none font-black text-[10px] px-4 py-1.5 rounded-full">DATA DINAMIS</Badge>
          </div>
          
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.operations.hourlyData}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0667AC" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0667AC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="hour" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 900 }}
                  dy={15}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ stroke: '#0667AC', strokeWidth: 2, strokeDasharray: '5 5' }}
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 20px 50px rgba(6,103,172,0.15)',
                    padding: '16px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#0667AC" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorOrders)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 4. INVENTORY ALERTS: Owner Focus */}
        <Card className="border-none shadow-2xl bg-white rounded-[3rem] p-10 flex flex-col border border-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-inner animate-pulse">
               <TrendingDown size={24} />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xl font-black text-[#3d2b1f] uppercase tracking-tight">Kebutuhan Stok</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Wajib Belanja Segera</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-5">
            {stats.inventoryAlerts.length > 0 ? (
              stats.inventoryAlerts.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100/50 hover:border-red-200 transition-all">
                  <div className="flex flex-col">
                    <span className="font-black text-[#3d2b1f] uppercase text-xs truncate max-w-[140px]">{item.name}</span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Sisa {item.current_stock} Porsi</span>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-500 font-black text-[8px] uppercase tracking-tighter">KRITIS</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 gap-3 opacity-40">
                 <LayoutGrid size={48} />
                 <p className="font-black text-[10px] uppercase tracking-widest text-center">Seluruh Bahan Baku Cukup</p>
              </div>
            )}
          </div>
          
          <button className="mt-8 w-full py-4 rounded-2xl bg-zinc-900 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all">
             Buka Laporan Gudang
          </button>
        </Card>
      </div>

      {/* 5. MENU PERFORMANCE: Stars Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <Card className="border-none shadow-2xl bg-white rounded-[3rem] p-10 border border-white">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-12 w-12 bg-orange-100 rounded-2xl flex items-center justify-center text-brand-secondary shadow-inner">
                 <Award size={24} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black text-[#3d2b1f] uppercase tracking-tight">Ranking Produk</h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">Menu Engineering Stars</p>
              </div>
            </div>
            <div className="space-y-6">
              {stats.bestsellers.map((item: any, idx: number) => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl border-2 flex items-center justify-center font-black transition-all duration-300",
                      idx === 0 
                        ? "bg-brand-secondary border-orange-200 text-brand-primary shadow-lg shadow-orange-200 scale-105" 
                        : "bg-zinc-50 border-zinc-100 text-zinc-400"
                    )}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-black text-[#3d2b1f] text-sm uppercase leading-none">{item.name}</p>
                      <p className="text-[10px] font-bold text-zinc-400 mt-1.5 uppercase tracking-widest">{item.qty} Porsi Terjual</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-32 bg-zinc-50 rounded-full overflow-hidden border border-zinc-100 hidden sm:block">
                     <div className="h-full bg-brand-primary/40 rounded-full" style={{ width: `${(item.qty / stats.bestsellers[0].qty) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
         </Card>

         <Card className="border-none shadow-2xl bg-brand-primary rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col justify-center">
            {/* Payment & Channel Insights */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-10">
               <div className="space-y-2">
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-none text-brand-secondary">Metode Transaksi</h3>
                  <p className="text-sm font-bold text-blue-100/50 uppercase tracking-widest">Visualisasi Perputaran Dana</p>
               </div>
               
               <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white/10 backdrop-blur-md p-7 rounded-[2.5rem] border border-white/10 flex flex-col items-center gap-4 transition-transform hover:scale-105">
                     <QrCode size={48} className="text-brand-secondary" />
                     <div className="text-center">
                        <p className="text-3xl font-black leading-none tabular-nums">{stats.paymentStats.qris}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-2">BCA QRIS SNAP</p>
                     </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-7 rounded-[2.5rem] border border-white/10 flex flex-col items-center gap-4 transition-transform hover:scale-105">
                     <Wallet size={48} className="text-blue-100/60" />
                     <div className="text-center">
                        <p className="text-3xl font-black leading-none tabular-nums">{stats.paymentStats.cash}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-2">Cash on Hand</p>
                     </div>
                  </div>
               </div>
               
               <div className="flex items-center justify-between px-2 pt-4 opacity-40">
                  <span className="text-[8px] font-black uppercase tracking-[0.4em]">Audit Trail v2.5</span>
                  <div className="h-1 w-1 rounded-full bg-white" />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em]">Bakti BCA</span>
               </div>
            </div>
         </Card>
      </div>
    </div>
  )
}
