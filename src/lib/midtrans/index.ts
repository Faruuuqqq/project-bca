// @ts-ignore
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
    const qrAction = response.actions?.find((action: any) => 
      action.name === 'generate-qr-code' || action.name === 'generate-qr'
    )
    
    if (!qrAction) {
      console.error("❌ [Midtrans] No QR action found. Actions available:", response.actions?.map((a:any) => a.name))
      return null
    }

    console.log("👉 [Midtrans] QR URL:", qrAction.url)
    return qrAction.url
  } catch (error: any) {
    console.error("❌ [Midtrans] Critical Error:", error.message || error)
    if (error.ApiResponse) {
      console.error("👉 API Details:", JSON.stringify(error.ApiResponse, null, 2))
    }
    return null
  }
}
