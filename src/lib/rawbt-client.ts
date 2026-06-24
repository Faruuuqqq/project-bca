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
    
    // Try to send to RawBT local web server (completely silent, no app switch)
    // Chrome allows http://127.0.0.1 requests from https:// contexts (Secure Contexts)
    const response = await fetch('http://127.0.0.1:40228/', {
      method: 'POST',
      body: bytes,
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });
    
    if (response.ok) {
      return true;
    }
  } catch (err) {
    console.warn('RawBT local server fallback:', err);
  }
  
  // Fallback to Intent which will switch apps briefly
  window.location.href = rawbtUrl;
  return true;
}
