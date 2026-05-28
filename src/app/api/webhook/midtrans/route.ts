import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { deductStockForOrder } from '@/lib/stock'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
    } = payload

    // 1. Verify Signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY!
    const stringToHash = order_id + status_code + gross_amount + serverKey
    const hash = crypto.createHash('sha512').update(stringToHash).digest('hex')

    if (hash !== signature_key) {
      console.error('Invalid Midtrans Signature')
      return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 400 })
    }

    // 2. Initialize Supabase with Service Role (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3. Update Order Status if Payment is Successful
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', order_id)
        .eq('payment_status', 'unpaid') // Idempotent check

      if (error) {
        console.error('DB Update Error:', error)
        return NextResponse.json({ status: 'error' }, { status: 500 })
      }
      
      console.log(`Order ${order_id} marked as PAID via Midtrans Webhook`)

      // 4. Deduct stock for all items in this order (idempotent)
      try {
        await deductStockForOrder(order_id, supabase)
      } catch (stockError) {
        // Log but don't fail the webhook — payment is already recorded
        console.error(`[Stock] Deduction failed for order ${order_id}:`, stockError)
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
