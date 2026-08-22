// lib/dateSpell.ts

const ORDINALS = [
  '', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
  'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth',
  'Nineteenth', 'Twentieth', 'Twenty-First', 'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth', 'Twenty-Fifth',
  'Twenty-Sixth', 'Twenty-Seventh', 'Twenty-Eighth', 'Twenty-Ninth', 'Thirtieth', 'Thirty-First',
]

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
const TEENS = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function spellTwoDigits(n: number): string {
  if (n < 10) return ONES[n]
  if (n < 20) return TEENS[n - 10]
  const tens = Math.floor(n / 10)
  const ones = n % 10
  return ones === 0 ? TENS[tens] : `${TENS[tens]}-${ONES[ones]}`
}

export function spellYear(year: number): string {
  const thousands = Math.floor(year / 1000)
  const remainder = year % 1000
  const hundreds = Math.floor(remainder / 100)
  const lastTwo = remainder % 100

  const thousandsWord = thousands === 2 ? 'Two Thousand' : `${ONES[thousands]} Thousand`
  if (hundreds === 0 && lastTwo === 0) return thousandsWord
  const parts = [thousandsWord]
  if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`)
  if (lastTwo > 0) parts.push(spellTwoDigits(lastTwo))
  return parts.join(' and ')
}

export function formatCertificateDate(date: Date): { day: string; month: string; year: string } {
  const day = ORDINALS[date.getDate()]
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const year = spellYear(date.getFullYear())
  return { day, month, year }
}