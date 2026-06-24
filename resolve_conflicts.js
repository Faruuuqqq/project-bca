const fs = require('fs');

// 1. Fix KioskGuard.tsx
let kiosk = fs.readFileSync('src/components/kiosk/KioskGuard.tsx', 'utf8');
const kioskRegex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n([\s\S]*?)>>>>>>> origin\/main/m;
// Let's replace the conflict marker with the main version (which has better typing)
kiosk = kiosk.replace(kioskRegex, `          const newData = payload.new as { config_value?: string }`);
fs.writeFileSync('src/components/kiosk/KioskGuard.tsx', kiosk);

// 2. Fix printer.ts
let printer = fs.readFileSync('src/lib/printer.ts', 'utf8');
const printerRegex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n([\s\S]*?)>>>>>>> origin\/main/m;
// Let's replace the conflict marker with the HEAD version (our RawBT logic)
const match = printer.match(printerRegex);
if (match) {
  printer = printer.replace(printerRegex, match[1].trim());
}
fs.writeFileSync('src/lib/printer.ts', printer);

console.log('Conflicts resolved');
