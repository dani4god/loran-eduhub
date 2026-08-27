// lib/verifyWithRetry.ts
export async function verifyWithRetry(
  url: string,
  maxRetries: number = 5,
  delayMs: number = 2000
): Promise<any> {
  let lastError: any = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url)
      const data = await res.json()

      // If successful or already processed, return immediately
      if (res.ok && (data.success || data.alreadyProcessed)) {
        return data
      }

      // If we got a response but it's not successful, check if we should retry
      if (res.status === 404 || res.status === 400) {
        // Don't retry on client errors (bad request, not found)
        return data
      }

      // For other errors, retry
      lastError = data.error || 'Unknown error'
    } catch (err) {
      lastError = err
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
    }
  }

  // If we exhausted all retries, return the last error
  return { success: false, error: lastError || 'Verification failed after multiple attempts' }
}