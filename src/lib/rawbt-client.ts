export async function sendToRawBT(rawbtUrl: string): Promise<boolean> {
  try {
    // Gunakan hidden iframe agar intent RawBT langsung terpicu tanpa
    // mengalihkan/meninggalkan halaman, sehingga tidak ada popup "buka aplikasi"
    // yang harus diklik manual oleh user. Browser modern memproses intent://
    // melalui iframe secara silent jika triggered dari dalam kode.
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = rawbtUrl
    document.body.appendChild(iframe)
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 2000)
    return true
  } catch (err) {
    // Fallback: window.location jika iframe gagal
    try {
      window.location.href = rawbtUrl
    } catch (_) {}
    return false
  }
}
