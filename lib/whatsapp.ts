// lib/whatsapp.ts

// ============================================================
// TYPES
// ============================================================

export interface WhatsAppSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface WhatsAppTemplateParameter {
  type: 'text'
  text: string
}

export interface WhatsAppTemplateComponent {
  type: 'body' | 'header'
  parameters: WhatsAppTemplateParameter[]
}

interface MetaWhatsAppResponse {
  messaging_product?: string

  contacts?: Array<{
    input?: string
    wa_id?: string
  }>

  messages?: Array<{
    id?: string
    message_status?: string
  }>

  error?: {
    message?: string
    type?: string
    code?: number
    error_subcode?: number
    fbtrace_id?: string
  }
}

// ============================================================
// CONFIGURATION
// ============================================================

function getWhatsAppConfig() {
  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN?.trim()

  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()

  const graphVersion =
    process.env.WHATSAPP_GRAPH_API_VERSION?.trim()

  if (!accessToken) {
    throw new Error(
      'WHATSAPP_ACCESS_TOKEN is not configured.'
    )
  }

  if (!phoneNumberId) {
    throw new Error(
      'WHATSAPP_PHONE_NUMBER_ID is not configured.'
    )
  }

  if (!graphVersion) {
    throw new Error(
      'WHATSAPP_GRAPH_API_VERSION is not configured.'
    )
  }

  return {
    accessToken,
    phoneNumberId,
    graphVersion,
  }
}

// ============================================================
// NORMALIZE PHONE NUMBER
// ============================================================

export function normalizeWhatsAppPhone(
  phone: string
): string {
  let normalized = phone
    .trim()
    .replace(/[^\d+]/g, '')

  /*
   * Your initial target market is Nigeria.
   *
   * 08031234567
   * becomes
   * 2348031234567
   */
  if (
    normalized.startsWith('0') &&
    normalized.length === 11
  ) {
    normalized =
      `234${normalized.slice(1)}`
  }

  if (normalized.startsWith('+')) {
    normalized = normalized.slice(1)
  }

  return normalized
}

// ============================================================
// BASIC PHONE VALIDATION
// ============================================================

export function isValidWhatsAppPhone(
  phone: string
): boolean {
  const normalized =
    normalizeWhatsAppPhone(phone)

  /*
   * General international-number sanity check.
   *
   * This does not claim that the number is registered
   * with WhatsApp. Meta ultimately determines that.
   */
  return /^[1-9]\d{7,14}$/.test(normalized)
}

// ============================================================
// META REQUEST
// ============================================================

async function sendMetaRequest(
  payload: Record<string, unknown>
): Promise<WhatsAppSendResult> {
  try {
    const {
      accessToken,
      phoneNumberId,
      graphVersion,
    } = getWhatsAppConfig()

    const controller =
      new AbortController()

    const timeout =
      setTimeout(() => {
        controller.abort()
      }, 20_000)

    try {
      const response = await fetch(
        `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify(payload),

          signal: controller.signal,

          cache: 'no-store',
        }
      )

      const responseData =
        (await response.json()) as MetaWhatsAppResponse

      if (!response.ok) {
        console.error(
          'WhatsApp API error:',
          {
            status: response.status,
            type:
              responseData.error?.type,
            code:
              responseData.error?.code,
            subcode:
              responseData.error
                ?.error_subcode,
            message:
              responseData.error
                ?.message,
          }
        )

        return {
          success: false,

          error:
            responseData.error?.message ||
            `WhatsApp API request failed with status ${response.status}.`,
        }
      }

      const messageId =
        responseData.messages?.[0]?.id

      if (!messageId) {
        console.error(
          'WhatsApp API returned no message ID:',
          responseData
        )

        return {
          success: false,
          error:
            'WhatsApp accepted the request but returned no message ID.',
        }
      }

      return {
        success: true,
        messageId,
      }
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'AbortError'
    ) {
      console.error(
        'WhatsApp API request timed out.'
      )

      return {
        success: false,
        error:
          'WhatsApp API request timed out.',
      }
    }

    console.error(
      'WhatsApp send error:',
      error
    )

    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : 'Unknown WhatsApp error.',
    }
  }
}

// ============================================================
// SEND TEXT MESSAGE
// ============================================================

export async function sendWhatsAppText(
  phone: string,
  message: string
): Promise<WhatsAppSendResult> {
  const normalizedPhone =
    normalizeWhatsAppPhone(phone)

  if (
    !isValidWhatsAppPhone(
      normalizedPhone
    )
  ) {
    return {
      success: false,
      error:
        'Invalid WhatsApp phone number.',
    }
  }

  const text = message.trim()

  if (!text) {
    return {
      success: false,
      error:
        'WhatsApp message cannot be empty.',
    }
  }

  return sendMetaRequest({
    messaging_product: 'whatsapp',

    recipient_type: 'individual',

    to: normalizedPhone,

    type: 'text',

    text: {
      preview_url: false,
      body: text,
    },
  })
}

// ============================================================
// SEND TEMPLATE MESSAGE
// ============================================================

export async function sendWhatsAppTemplate({
  phone,
  templateName,
  languageCode = 'en',
  components = [],
}: {
  phone: string
  templateName: string
  languageCode?: string
  components?: WhatsAppTemplateComponent[]
}): Promise<WhatsAppSendResult> {
  const normalizedPhone =
    normalizeWhatsAppPhone(phone)

  if (
    !isValidWhatsAppPhone(
      normalizedPhone
    )
  ) {
    return {
      success: false,
      error:
        'Invalid WhatsApp phone number.',
    }
  }

  if (!templateName.trim()) {
    return {
      success: false,
      error:
        'WhatsApp template name is required.',
    }
  }

  return sendMetaRequest({
    messaging_product: 'whatsapp',

    recipient_type: 'individual',

    to: normalizedPhone,

    type: 'template',

    template: {
      name: templateName.trim(),

      language: {
        code: languageCode,
      },

      ...(components.length > 0
        ? {
            components,
          }
        : {}),
    },
  })
}

// ============================================================
// SIMPLE BODY-TEMPLATE HELPER
// ============================================================

export async function sendWhatsAppBodyTemplate({
  phone,
  templateName,
  values,
  languageCode = 'en',
}: {
  phone: string
  templateName: string
  values: string[]
  languageCode?: string
}): Promise<WhatsAppSendResult> {
  const components:
    WhatsAppTemplateComponent[] =
      values.length > 0
        ? [
            {
              type: 'body',

              parameters: values.map(
                (value) => ({
                  type: 'text',
                  text: String(value),
                })
              ),
            },
          ]
        : []

  return sendWhatsAppTemplate({
    phone,
    templateName,
    languageCode,
    components,
  })
}