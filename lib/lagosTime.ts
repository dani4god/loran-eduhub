// lib/lagosTime.ts

export function getLagosSlotDateTime(
  dateValue: Date | string,
  time: string
): Date | null {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const parts =
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)

  const year =
    parts.find(
      (part) => part.type === 'year'
    )?.value

  const month =
    parts.find(
      (part) => part.type === 'month'
    )?.value

  const day =
    parts.find(
      (part) => part.type === 'day'
    )?.value

  if (!year || !month || !day) {
    return null
  }

  const [hourText, minuteText] =
    String(time).split(':')

  const hour = Number(hourText)
  const minute = Number(minuteText)

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null
  }

  /*
   * Nigeria uses UTC+01:00 throughout the year
   * and does not currently observe daylight saving time.
   */
  const iso =
    `${year}-${month}-${day}` +
    `T${String(hour).padStart(2, '0')}` +
    `:${String(minute).padStart(2, '0')}` +
    `:00+01:00`

  const result = new Date(iso)

  if (Number.isNaN(result.getTime())) {
    return null
  }

  return result
}

export function isLagosSlotInFuture(
  dateValue: Date | string,
  startTime: string
) {
  const slotStart =
    getLagosSlotDateTime(
      dateValue,
      startTime
    )

  if (!slotStart) {
    return false
  }

  return (
    slotStart.getTime() >
    Date.now()
  )
}