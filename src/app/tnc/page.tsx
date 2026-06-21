import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-6 sm:px-12">
      <div className="w-full max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-xl space-y-8">
        <div className="flex items-center gap-4 border-b pb-6">
          <Link href="/">
            <Button variant="outline" size="icon" className="rounded-full">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-brand-primary">Syarat & Ketentuan (Terms & Conditions)</h1>
        </div>

        <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
          <p className="font-medium text-lg">Terakhir Diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">1. Pendahuluan</h2>
            <p>Selamat datang di sistem pemesanan Ayam Kalintang. Syarat & Ketentuan ini mengatur penggunaan aplikasi Kiosk dan layanan pemesanan makanan kami. Dengan menggunakan aplikasi ini, Anda setuju untuk terikat oleh Syarat & Ketentuan ini.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">2. Proses Pemesanan & Pembayaran</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pemesanan dilakukan melalui sistem Kiosk secara mandiri oleh pelanggan.</li>
              <li>Harga yang tertera pada menu sudah termasuk pajak restoran sesuai ketentuan yang berlaku, kecuali dinyatakan lain.</li>
              <li>Pembayaran dapat dilakukan melalui QRIS, kartu debit/kredit, atau metode pembayaran sah lainnya yang tersedia di sistem kami.</li>
              <li>Pesanan baru akan diproses oleh dapur (Kitchen Display System) setelah pembayaran berhasil diverifikasi oleh sistem.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">3. Kebijakan Pengembalian Dana (Refund Policy)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Semua transaksi yang telah berhasil dibayar <strong>tidak dapat dibatalkan atau diuangkan kembali (non-refundable)</strong> apabila pesanan sudah masuk antrean dapur.</li>
              <li>Pengembalian dana (refund) hanya dapat dilakukan jika terjadi kesalahan sistem dari pihak Ayam Kalintang (misalnya dana terpotong namun pesanan tidak masuk) atau jika menu yang dipesan ternyata kehabisan stok (sold out) setelah pembayaran.</li>
              <li>Proses refund untuk pembayaran non-tunai akan dikembalikan ke rekening/e-wallet pelanggan yang digunakan saat transaksi dalam waktu maksimal 7-14 hari kerja, sesuai dengan kebijakan Bank/Payment Gateway (Midtrans).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">4. Pengiriman / Penyerahan Makanan</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pesanan <em>Dine-in</em> akan disajikan ke meja pelanggan atau diambil di area pengambilan sesuai nomor antrean.</li>
              <li>Pesanan <em>Take-away</em> wajib dicek kelengkapannya oleh pelanggan sebelum meninggalkan outlet. Ayam Kalintang tidak bertanggung jawab atas kekurangan item setelah pelanggan meninggalkan area outlet.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">5. Tentang Kami & Kontak Layanan</h2>
            <p><strong>SOK Ayam Kalintang</strong> adalah penyedia layanan F&B (Food and Beverage) dengan fokus menyajikan olahan ayam terbaik. Kami berkomitmen memberikan pengalaman pemesanan yang cepat dan praktis melalui sistem Kiosk.</p>
            <p>Jika Anda memiliki pertanyaan terkait pesanan, menu, atau Syarat & Ketentuan ini, silakan hubungi kami melalui informasi di bawah ini:</p>
            <ul className="list-none space-y-1 bg-gray-100 p-4 rounded-lg">
              <li><strong>Nama Bisnis:</strong> SOK Ayam Kalintang</li>
              <li><strong>Email:</strong> cs@ayamkalintang.com</li>
              <li><strong>WhatsApp:</strong> + 62 895-6021-21652</li>
              <li><strong>Alamat:</strong> Depan Polsek Jatinangor, Cikeruh, Kec. Jatinangor, Kabupaten Sumedang, Jawa Barat 45360</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
