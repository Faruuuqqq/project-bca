// @ts-expect-error midtrans-client has no type declarations
import midtransClient from 'midtrans-client'

/**
 * MIDTRANS API LIBRARY (SOK Ayam Kalintang)
 * Digunakan untuk generate QRIS Dinamis melalui Core API.
 * 
 * FIX #1: Environment variable validation
 * - Prevents silent failures when keys are missing
 * - Throws error at startup instead of at payment time
 * - Makes debugging easier in production
 */

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'

// Validate environment variables at module load time
const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim()
const clientKey = process.env.MIDTRANS_CLIENT_KEY?.trim()

if (!serverKey || !clientKey) {
  const missingVars = []
  if (!serverKey) missingVars.push('MIDTRANS_SERVER_KEY')
  if (!clientKey) missingVars.push('MIDTRANS_CLIENT_KEY')
  
  throw new Error(
    `CRITICAL: Midtrans API keys not configured in environment variables.\n` +
    `Missing: ${missingVars.join(', ')}\n` +
    `Please set these variables in .env or Vercel environment settings.\n` +
    `See: https://midtrans.com/developers`
  )
}

export const midtransCore = new midtransClient.CoreApi({
  isProduction: isProduction,
  serverKey: serverKey,
  clientKey: clientKey,
})

/**
 * Generate Direct QRIS (Gopay/QRIS)
 * Mengembalikan string QR atau URL Image QR
 * 
 * FIX #1 Enhancement: Better error logging
 * - Logs API response times for monitoring
 * - Distinguishes between different error types
 */
export async function generateMidtransQRIS(orderId: string, amount: number) {
  const startTime = Date.now()
  console.log(`🚀 [Midtrans] Generating QRIS for Order: ${orderId}, Amount: ${amount}`)
  
  try {
    // Validate inputs
    if (!orderId || typeof orderId !== 'string') {
      throw new Error('Invalid orderId provided to generateMidtransQRIS')
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid amount provided to generateMidtransQRIS')
    }

    const parameter = {
      payment_type: "gopay",
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(amount),
      }
    }

    const response = await midtransCore.charge(parameter)
    const responseTime = Date.now() - startTime
    console.log(`✅ [Midtrans] Charge Response Received (${responseTime}ms)`)
    
    // Midtrans GoPay returns 'generate-qr-code' or 'generate-qr-code-v2'
    const qrAction = response.actions?.find((action: { name: string; url: string }) => 
      action.name === 'generate-qr-code' || action.name === 'generate-qr'
    )
    
    if (!qrAction) {
      console.error("❌ [Midtrans] No QR action found. Actions available:", response.actions?.map((a: { name: string }) => a.name))
      return null
    }

    console.log("👉 [Midtrans] QR URL:", qrAction.url)
    return qrAction.url
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error(`❌ [Midtrans] Critical Error (${responseTime}ms):`, errMsg)
    
    if (typeof error === 'object' && error !== null && 'ApiResponse' in error) {
      const httpStatus = (error as Record<string, unknown>).httpStatusCode || "Unknown"
      console.error("👉 API HTTP Status:", httpStatus)
    }
    
    return null
  }
}
