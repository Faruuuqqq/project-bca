// @ts-expect-error midtrans-client has no type declarations
import midtransClient from 'midtrans-client'

/**
 * MIDTRANS API LIBRARY (SOK Ayam Kalintang)
 * Digunakan untuk generate QRIS Dinamis melalui Core API.
 */

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'

export const midtransCore = new midtransClient.CoreApi({
  isProduction: isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
})

/**
 * Generate Direct QRIS (Gopay/QRIS)
 * Mengembalikan string QR atau URL Image QR
 */
export async function generateMidtransQRIS(orderId: string, amount: number) {
  console.log(`🚀 [Midtrans] Generating QRIS for Order: ${orderId}, Amount: ${amount}`)
  
  try {
    if (!process.env.MIDTRANS_SERVER_KEY) {
      throw new Error("MIDTRANS_SERVER_KEY is missing in environment variables")
    }

    const parameter = {
      payment_type: "gopay",
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(amount),
      }
    }

    const response = await midtransCore.charge(parameter)
    console.log("✅ [Midtrans] Charge Response Received")
    
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
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error("❌ [Midtrans] Critical Error:", errMsg)
    if (typeof error === 'object' && error !== null && 'ApiResponse' in error) {
      console.error("👉 API HTTP Status:", (error as Record<string, unknown>).httpStatusCode || "Unknown")
    }
    return null
  }
}
