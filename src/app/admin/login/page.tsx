'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Lock, Store } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('Login berhasil')
      router.push('/admin')
      router.refresh()
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Login gagal. Periksa kembali email dan password Anda.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f7ff] p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-secondary/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md shadow-[0_40px_100px_rgba(6,103,172,0.1)] border-none rounded-[3rem] bg-white/80 backdrop-blur-xl relative z-10 overflow-hidden">
        <div className="h-2 bg-brand-primary" />
        <CardHeader className="space-y-4 text-center p-8 md:p-12 pb-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-primary text-brand-secondary shadow-xl shadow-blue-200">
            <Store size={40} />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-[#3d2b1f] uppercase tracking-tighter">Ayam Kalintang</h2>
            <CardDescription className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Portal Manajemen Toko</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 md:p-12 pt-4">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Email Administrator</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@kalintang.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 rounded-2xl border-2 border-zinc-100 focus:border-brand-primary focus:ring-0 transition-all bg-zinc-50/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" title="Pin Keamanan" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Kata Sandi</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 rounded-2xl border-2 border-zinc-100 focus:border-brand-primary focus:ring-0 transition-all bg-zinc-50/50"
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                </div>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-brand-primary hover:bg-blue-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 transition-all active:scale-[0.98] uppercase tracking-tight"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'MASUK KE DASHBOARD'}
            </Button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-zinc-100 flex items-center justify-center gap-4 text-zinc-300">
             <div className="h-px w-8 bg-zinc-100" />
             <p className="text-[9px] font-black uppercase tracking-widest">Bakti BCA v2.5</p>
             <div className="h-px w-8 bg-zinc-100" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
