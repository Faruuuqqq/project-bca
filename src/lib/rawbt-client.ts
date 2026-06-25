import { toast } from 'sonner';

export async function sendToRawBT(rawbtUrl: string): Promise<boolean> {
  try {
    if (!rawbtUrl.includes('base64,')) {
      window.location.href = rawbtUrl;
      return true;
    }
    
    const base64Data = rawbtUrl.split('base64,')[1].split('#')[0];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Attempt 1: Fetch API with no-cors
    try {
      await fetch('http://127.0.0.1:40228/', {
        method: 'POST',
        body: bytes,
        mode: 'no-cors', // Penting untuk bypass CORS error di Vercel/HTTPS
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      });
      return true; // no-cors selalu return opaque response, jadi kita asumsikan sukses jika tidak throw error
    } catch (fetchErr) {
      console.warn('Fetch failed, trying WebSocket...', fetchErr);
      
      // Attempt 2: WebSocket API (Bypasses CORS completely)
      return await new Promise((resolve) => {
        try {
          const socket = new WebSocket('ws://127.0.0.1:40228/');
          
          socket.onopen = () => {
            socket.send(bytes.buffer);
            setTimeout(() => {
              socket.close();
              resolve(true);
            }, 500);
          };
          
          socket.onerror = () => {
            toast.error('Gagal koneksi ke Printer. Pastikan Web Server di aplikasi RawBT sudah AKTIF.', { duration: 5000 });
            resolve(false);
          };
        } catch (wsErr) {
          resolve(false);
        }
      });
    }
  } catch (err) {
    console.error('RawBT data processing failed', err);
    return false;
  }
}
