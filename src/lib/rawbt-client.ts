export async function sendToRawBT(rawbtUrl: string): Promise<boolean> {
  try {
    // Alternatif 1: Memanggil aplikasi RawBT langsung via Intent.
    // Metode ini 100% tahan banting di semua versi Chrome Android.
    // Pastikan fitur "Return to calling application" di RawBT dicentang
    // agar layar langsung otomatis kembali ke web setelah print selesai.
    window.location.href = rawbtUrl;
    
    return true;
  } catch (err) {
    console.error('Gagal mengirim ke RawBT via Intent', err);
    return false;
  }
}
