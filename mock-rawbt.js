const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

const PORT = 40228; // RawBT default port
const PRINTER_SHARE_NAME = process.argv[2]; // Optional: Name of shared printer

const server = http.createServer((req, res) => {
  // Setup CORS to accept requests from our web app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = [];
    
    req.on('data', chunk => {
      body.push(chunk);
    });
    
    req.on('end', () => {
      const buffer = Buffer.concat(body);
      console.log(`\n[RawBT Mock] Menerima data print: ${buffer.length} bytes`);
      
      // Save the raw ESC/POS binary to a file
      const filename = 'receipt.bin';
      fs.writeFileSync(filename, buffer);
      console.log(`[RawBT Mock] Tersimpan ke file: ${filename}`);

      // If user provided a printer name, try to print it directly on Windows
      if (PRINTER_SHARE_NAME) {
        // e.g. copy /b receipt.bin \\localhost\ThermalPrinter
        const cmd = `copy /b ${filename} \\\\127.0.0.1\\${PRINTER_SHARE_NAME}`;
        console.log(`[RawBT Mock] Mencetak ke printer: ${cmd}`);
        
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            console.error(`[RawBT Mock] Gagal mencetak: ${error.message}`);
            return;
          }
          console.log(`[RawBT Mock] Berhasil mencetak ke mesin!`);
        });
      } else {
        console.log(`[RawBT Mock] INFO: Jika Anda ingin langsung mencetak ke printer USB/Bluetooth Anda di Windows, jalankan script ini dengan nama printer yang di-share.`);
        console.log(`Contoh: node mock-rawbt.js "NamaPrinterShare"`);
      }

      // Return HTTP 200 OK to the React App so it thinks printing succeeded
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`
=============================================
🚀 RAWBT MOCK SERVER BERJALAN DI WINDOWS 🚀
=============================================
Server mendengar di http://127.0.0.1:${PORT}/

Sekarang Anda bisa menjalankan aplikasi Next.js (npm run dev)
dan mencoba Checkout. Aplikasi akan mendeteksi server ini 
dan mengira ini adalah aplikasi RawBT di Android!
`);
  if (!PRINTER_SHARE_NAME) {
    console.log(`💡 TIPS: Untuk mencetak struk langsung ke printer fisik yang Anda pinjam:`);
    console.log(`1. Buka Windows Settings -> Devices -> Printers`);
    console.log(`2. Klik printer struk Anda -> Manage -> Printer properties -> tab Sharing`);
    console.log(`3. Centang "Share this printer" dan beri nama pendek (misal: POS)`);
    console.log(`4. Matikan server ini (Ctrl+C), lalu jalankan lagi dengan nama tersebut:`);
    console.log(`   node mock-rawbt.js POS`);
  }
});
