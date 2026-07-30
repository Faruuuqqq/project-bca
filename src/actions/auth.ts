'use server'

import { cookies } from 'next/headers'
import { signToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function verifyAdminPin(pin: string): Promise<{ success: boolean }> {
  const supabase = createAdminClient()
  
  // Ambil cashier_pin dari database store_configs (konsisten dengan confirmCashPayment & voidOrder)
  const { data: config } = await supabase
    .from('store_configs')
    .select('config_value')
    .eq('config_key', 'cashier_pin')
    .single()

  const validPin = config?.config_value ?? process.env.ADMIN_PIN ?? '1234'

  if (pin !== validPin) {
    return { success: false }
  }

  const token = signToken()
  const cookieStore = await cookies()

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  })

  return { success: true }
}
