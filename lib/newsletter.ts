// lib/newsletter.ts

interface NewsletterParams {
  heading: string
  bodyHtml: string
  imageUrl?: string
  links: { label: string; url: string }[]
}

export function buildNewsletterHtml(params: NewsletterParams): string {
  const { heading, bodyHtml, imageUrl, links } = params

  const linksHtml = links.length > 0
    ? `
    <div style="margin: 28px 0; text-align: center;">
      ${links.map((l) => `
        <a href="${l.url}" style="display: inline-block; margin: 0 6px 10px 6px; padding: 12px 22px; background: linear-gradient(135deg, #2563eb, #4338ca); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
          ${l.label}
        </a>
      `).join('')}
    </div>`
    : ''

  return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #2563eb, #4338ca); padding: 28px 36px; border-radius: 12px 12px 0 0; text-align: center;">
    <p style="color: #bfdbfe; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin: 0;">Loran EduHub</p>
  </div>

  <div style="border: 1px solid #e5e7eb; border-top: none;">
    ${imageUrl ? `<img src="${imageUrl}" alt="" style="width: 100%; display: block; max-height: 320px; object-fit: cover;" />` : ''}

    <div style="padding: 32px 36px;">
      <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 18px 0; line-height: 1.3;">${heading}</h1>

      <div style="font-size: 15px; color: #374151; line-height: 1.75;">
        ${bodyHtml}
      </div>

      ${linksHtml}
    </div>
  </div>

  <div style="padding: 20px 36px; text-align: center;">
    <p style="font-size: 12px; color: #9ca3af; margin: 0 0 6px 0;">
      You're receiving this because you have an account with Loran EduHub.
    </p>
    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
      © ${new Date().getFullYear()} Loran EduHub. All rights reserved.
    </p>
  </div>
</div>
`.trim()
}