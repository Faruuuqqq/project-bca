import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(value: number | null | undefined): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value ?? 0)}`
}

export function formatDate(
  input: Date | string,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string {
  const d = typeof input === 'string' ? new Date(input) : input
  return d.toLocaleDateString('id-ID', opts)
}

export function formatTime(
  input: Date | string,
  opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
): string {
  const d = typeof input === 'string' ? new Date(input) : input
  return d.toLocaleTimeString('id-ID', opts)
}

export function formatDateTime(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input
  return d.toLocaleString('id-ID')
}
