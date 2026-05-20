import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    completed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
    draft: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
    approved: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    processing: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    paid: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    failed: 'text-red-400 bg-red-400/10 border-red-400/20',
  }
  return map[status?.toLowerCase()] || 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'
}

export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function initiateRazorpayPayment(options: {
  orderId: string
  amount: number
  keyId: string
  name: string
  description: string
  prefill?: { name?: string; email?: string; contact?: string }
  onSuccess: (data: any) => void
  onFailure: (error: any) => void
}): Promise<void> {
  const loaded = await loadRazorpay()
  if (!loaded) {
    options.onFailure(new Error('Failed to load Razorpay'))
    return
  }

  const rzp = new (window as any).Razorpay({
    key: options.keyId,
    amount: options.amount * 100,
    currency: 'INR',
    name: 'VeLOQ',
    description: options.description,
    order_id: options.orderId,
    prefill: options.prefill,
    theme: { color: '#10b981' },
    handler: (response: any) => options.onSuccess(response),
    modal: {
      ondismiss: () => options.onFailure(new Error('Payment cancelled')),
    },
  })
  rzp.open()
}
