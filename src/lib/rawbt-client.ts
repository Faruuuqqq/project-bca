import { toast } from 'sonner';

export async function sendToRawBT(rawbtUrl: string): Promise<boolean> {
  try {
    // Memanggil aplikasi RawBT langsung via Intent.
    // Metode ini 100% tahan banting di semua versi Chrome Android.
    // Kita sudah menambahkan parameter "S.return=true" di URL backend
    // agar layar langsung otomatis kembali ke web setelah print selesai.
    window.location.href = rawbtUrl;
    
    return true;
  } catch (err) {
    console.error('Gagal mengirim ke RawBT via Intent', err);
    return false;
  }
}
