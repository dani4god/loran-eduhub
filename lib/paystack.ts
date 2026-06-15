// lib/paystack.ts
import { PLAN_PRICES } from './constants'

// Paystack configuration
export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

// Paystack transaction status type
export type PaystackStatus = 'success' | 'failed' | 'pending'

// Calculate total amount based on selected courses and plan
export function calculateTotalAmount(courseCount: number, plan: keyof typeof PLAN_PRICES): number {
  const basePrice = PLAN_PRICES[plan]
  return basePrice * courseCount
}

// Format amount for Paystack (converts to kobo/cent)
export function formatPaystackAmount(amount: number): number {
  return amount * 100
}

// Format amount for display (from kobo to Naira)
export function formatDisplayAmount(amount: number): number {
  return amount / 100
}

// Initialize Paystack transaction
export async function initializePaystackTransaction(
  email: string,
  amount: number,
  reference: string,
  metadata: Record<string, any>
) {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: formatPaystackAmount(amount),
      reference,
      callback_url: `${process.env.NEXTAUTH_URL}/payment/verify`,
      metadata,
    }),
  })

  return response.json()
}

// Verify Paystack transaction
export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  })

  return response.json()
}

// Load Paystack inline popup script
export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already exists
    if (document.querySelector('script[src*="paystack"]')) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Paystack script'))
    document.head.appendChild(script)
  })
}

// Open Paystack inline popup
export interface PaystackOptions {
  key: string
  email: string
  amount: number
  ref: string
  metadata?: Record<string, any>
  callback: (response: any) => void
  onClose: () => void
}

export function openPaystackPopup(options: PaystackOptions) {
  const handler = (window as any).PaystackPop.setup({
    key: options.key,
    email: options.email,
    amount: options.amount,
    ref: options.ref,
    metadata: options.metadata,
    callback: options.callback,
    onClose: options.onClose,
  })
  handler.openIframe()
}

// Generate unique transaction reference
export function generateTransactionReference(prefix: string = 'LORAN'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}