import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-6 sm:px-12">
      <div className="w-full max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-xl space-y-8">
        <div className="flex items-center gap-4 border-b pb-6">
          <Link href="/">
            <Button variant="outline" size="icon" className="rounded-full">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-brand-primary">Kebijakan Privasi (Privacy Policy)</h1>
        </div>
        
        <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
          <p className="font-medium text-lg">Terakhir Diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">1. Pengumpulan Data</h2>
            <p>Kami sangat menghargai privasi Anda. Dalam penggunaan sistem pemesanan Ayam Kalintang (Kiosk), kami hanya mengumpulkan data yang diperlukan untuk memproses pesanan Anda, termasuk namun tidak terbatas pada:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Informasi transaksi dan pembayaran (diproses secara aman oleh Midtrans sebagai Payment Gateway kami).</li>
              <li>Data pesanan (menu yang dibeli, waktu pembelian).</li>
              <li>Informasi opsional yang mungkin Anda berikan saat menghubungi Customer Service.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">2. Penggunaan Data</h2>
            <p>Data yang dikumpulkan hanya akan digunakan untuk tujuan:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Memproses dan mengelola pesanan serta pembayaran Anda.</li>
              <li>Menangani pengembalian dana (refund) jika terjadi kegagalan sistem.</li>
              <li>Meningkatkan kualitas layanan operasional dan pengalaman pelanggan di outlet kami.</li>
              <li>Memenuhi kewajiban hukum atau peraturan yang berlaku di Indonesia.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">3. Keamanan Data & Pihak Ketiga</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Kami tidak menjual, menyewakan, atau menukar data pribadi Anda kepada pihak ketiga manapun untuk tujuan pemasaran pemasaran.</li>
              <li>Pemrosesan pembayaran dilakukan secara terenkripsi dan dijamin keamanannya oleh <strong>Midtrans</strong>, payment gateway resmi yang diawasi oleh Bank Indonesia dan Otoritas Jasa Keuangan (OJK).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">4. Hak Pengguna</h2>
            <p>Sebagai pelanggan, Anda berhak untuk menghubungi kami jika ada pertanyaan atau kekhawatiran terkait data yang mungkin terekam selama proses transaksi.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">5. Kontak Kami</h2>
            <p>Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami:</p>
            <ul className="list-none space-y-1 bg-gray-100 p-4 rounded-lg">
              <li><strong>Email:</strong> cs@ayamkalintang.com</li>
              <li><strong>WhatsApp:</strong> +62 895-6021-21652</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
