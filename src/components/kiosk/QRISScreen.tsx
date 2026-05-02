'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, QrCode, AlertCircle } from 'lucide-react'
import { useCartStore } from '@/store/cart'

interface QRISScreenProps {
  orderId: string
  snapToken: string
  onCancel: () => void
}

export function QRISScreen({ orderId, snapToken, onCancel }: QRISScreenProps) {
  const router = useRouter()
  const supabase = createClient()
  const clearCart = useCartStore(state => state.clearCart)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load Midtrans Snap Script
    const midtransScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js'
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY

    let script = document.createElement('script')
    script.src = midtransScriptUrl
    script.setAttribute('data-client-key', clientKey!)
    script.onload = () => {
      // @ts-ignore
      window.snap.embed(snapToken, {
        embedId: 'snap-container',
        onSuccess: function(result: any) {
          console.log('Payment success:', result)
          handleSuccess()
        },
        onPending: function(result: any) {
          console.log('Payment pending:', result)
        },
        onError: function(result: any) {
          console.error('Payment error:', result)
          setError('Terjadi kesalahan saat memproses pembayaran.')
        },
        onClose: function() {
          console.log('Customer closed the popup without finishing the payment')
        }
      })
      setIsLoaded(true)
    }
    document.body.appendChild(script)

    // Realtime subscription for status update (fallback if snap callback is missed)
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          if (payload.new.payment_status === 'paid') {
            handleSuccess()
          }
        }
      )
      .subscribe()

    return () => {
      document.body.removeChild(script)
      supabase.removeChannel(channel)
    }
  }, [orderId, snapToken, supabase])

  const handleSuccess = () => {
    clearCart()
    router.push(`/success?id=${orderId}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="bg-[#d42c2c] p-6 text-white text-center">
        <h2 className="text-2xl font-bold italic tracking-wider">PEMBAYARAN QRIS</h2>
        <p className="text-sm opacity-80">Scan QR Code di bawah untuk membayar</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {!isLoaded && !error && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#d42c2c]" />
            <p className="text-zinc-500 font-medium">Menyiapkan QR Code...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-16 w-16 text-[#d42c2c]" />
            <p className="text-lg font-bold text-[#3d2b1f]">{error}</p>
            <Button onClick={onCancel} variant="outline" className="rounded-xl">Kembali dan Coba Lagi</Button>
          </div>
        )}

        <div id="snap-container" className="w-full max-w-md h-[500px] rounded-2xl overflow-hidden shadow-2xl"></div>
      </div>

      <div className="p-8 border-t bg-zinc-50">
        <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl text-blue-700">
          <QrCode className="shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-bold">Instruksi:</p>
            <ol className="list-decimal list-inside space-y-1 opacity-80">
              <li>Buka aplikasi pembayaran (GoPay, OVO, ShopeePay, atau Bank).</li>
              <li>Scan QR Code yang muncul di layar.</li>
              <li>Selesaikan pembayaran di ponsel Anda.</li>
              <li>Layar ini akan otomatis berganti setelah pembayaran lunas.</li>
            </ol>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          className="w-full mt-6 text-zinc-400"
          onClick={onCancel}
        >
          Batalkan & Ganti Metode Bayar
        </Button>
      </div>
    </div>
  )
}
