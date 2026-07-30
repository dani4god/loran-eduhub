// lib/paystackTransfer.ts
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

async function paystackRequest(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`https://api.paystack.co${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok || data.status === false) {
    throw new Error(data.message || `Paystack request failed (${res.status})`)
  }
  return data
}

export async function listNigerianBanks() {
  const data = await paystackRequest('/bank?country=nigeria&currency=NGN')

  const uniqueBanks = Array.from(
    new Map(
      (data.data as { name: string; code: string }[]).map((bank) => [
        bank.code,
        bank,
      ])
    ).values()
  )

  uniqueBanks.sort((a, b) => a.name.localeCompare(b.name))

  return uniqueBanks
}

// Verifies an account number actually belongs to the stated bank, and
// returns the real account holder name — used so tutors can't typo their
// own account number without noticing.
export async function resolveAccountNumber(accountNumber: string, bankCode: string) {
  const data = await paystackRequest(
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
  )
  return data.data as { account_number: string; account_name: string }
}

export async function createTransferRecipient(params: {
  name: string
  accountNumber: string
  bankCode: string
}) {
  const data = await paystackRequest('/transferrecipient', {
    method: 'POST',
    body: JSON.stringify({
      type: 'nuban',
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: 'NGN',
    }),
  })
  return data.data.recipient_code as string
}

export async function initiateTransfer(params: {
  recipientCode: string
  amount: number // NGN, not kobo
  reason: string
  reference: string
}) {
  const data = await paystackRequest('/transfer', {
    method: 'POST',
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(params.amount * 100),
      recipient: params.recipientCode,
      reason: params.reason,
      reference: params.reference,
    }),
  })
  return data.data as { status: string; transfer_code: string; reference: string }
}