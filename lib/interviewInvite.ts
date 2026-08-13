// lib/interviewInvite.ts

interface InviteParams {
  tutorFirstName: string
  tutorLastName: string
  courseNames: string[]
  scheduledDate: Date
  venue: string
  meetingLink?: string
  hrName: string
}

export function buildInterviewInviteHtml(params: InviteParams): string {
  const { tutorFirstName, tutorLastName, courseNames, scheduledDate, venue, meetingLink, hrName } = params

  const dateStr = scheduledDate.toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeStr = scheduledDate.toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit',
  })

  const coursesText = courseNames.length > 0 ? courseNames.join(', ') : 'the course(s) you applied for'

  return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #2563eb, #4338ca); padding: 32px 36px; border-radius: 12px 12px 0 0;">
    <p style="color: #bfdbfe; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 8px 0;">Loran EduHub</p>
    <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0;">Interview Invitation</h1>
  </div>

  <div style="padding: 32px 36px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 15px; color: #1f2937; line-height: 1.6;">Dear ${tutorFirstName} ${tutorLastName},</p>

    <p style="font-size: 15px; color: #374151; line-height: 1.7;">
      Thank you for applying to become a tutor with <strong>Loran EduHub</strong>. We were impressed with
      your application and would like to invite you to an interview as the next step in our selection process.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 13px; width: 100px; vertical-align: top;">Date</td>
          <td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 600;">${dateStr}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 13px; vertical-align: top;">Time</td>
          <td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 600;">${timeStr}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; font-size: 13px; vertical-align: top;">Venue</td>
          <td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: 600;">${venue}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 15px; color: #374151; line-height: 1.7;">
      <strong>This interview will take place on Discord.</strong> Please review the steps below to make sure
      you're set up and ready to join on time.
    </p>

    <!-- Discord setup steps -->
    <div style="background-color: #eef2ff; border: 1px solid #e0e7ff; border-radius: 10px; padding: 20px 24px; margin: 20px 0;">
      <p style="font-size: 14px; font-weight: 700; color: #3730a3; margin: 0 0 12px 0;">📌 How to Set Up Discord</p>

      <p style="font-size: 13px; font-weight: 700; color: #1f2937; margin: 14px 0 6px 0;">On a Windows PC:</p>
      <ol style="font-size: 13px; color: #374151; line-height: 1.8; padding-left: 20px; margin: 0;">
        <li>Go to <a href="https://discord.com/download" style="color: #4338ca;">discord.com/download</a> and download the Windows app</li>
        <li>Run the installer and let it finish setting up automatically</li>
        <li>Open Discord, click "Register" and create a free account (or log in if you already have one)</li>
        <li>Verify your email address if prompted</li>
      </ol>

      <p style="font-size: 13px; font-weight: 700; color: #1f2937; margin: 14px 0 6px 0;">On your Phone:</p>
      <ol style="font-size: 13px; color: #374151; line-height: 1.8; padding-left: 20px; margin: 0;">
        <li>Download "Discord" from the App Store (iPhone) or Google Play Store (Android)</li>
        <li>Open the app and create a free account, or log in if you already have one</li>
        <li>Verify your email address if prompted</li>
      </ol>

      <p style="font-size: 13px; font-weight: 700; color: #1f2937; margin: 14px 0 6px 0;">Joining the Interview:</p>
      <ol style="font-size: 13px; color: #374151; line-height: 1.8; padding-left: 20px; margin: 0;">
        <li>${meetingLink
          ? `On the day and time of your interview, click this link to join our server: <a href="${meetingLink}" style="color: #4338ca; font-weight: 600;">${meetingLink}</a>`
          : 'You will receive a server link from us closer to the interview date'}</li>
        <li>Accept the invite and enter the "Interview" voice channel</li>
      </ol>
    </div>

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
      <p style="font-size: 13px; color: #92400e; margin: 0; line-height: 1.6;">
        ⚠️ <strong>Please note:</strong> for the best experience, we recommend joining from a <strong>PC/laptop</strong>
        rather than a phone, and ensuring you have a <strong>stable, strong internet connection</strong> before the
        interview begins.
      </p>
    </div>

    <p style="font-size: 15px; color: #374151; line-height: 1.7;">
      As part of the interview, please come prepared to <strong>teach a 15-minute mock lesson</strong> to a
      member of our HR team, on any topic within <strong>${coursesText}</strong>. This helps us understand
      your teaching style and how you'd engage with students on our platform.
    </p>

    <p style="font-size: 15px; color: #374151; line-height: 1.7;">
      A few tips ahead of the session:
    </p>
    <ul style="font-size: 14px; color: #374151; line-height: 1.8; padding-left: 20px;">
      <li>Choose a specific, focused topic rather than a broad overview</li>
      <li>Feel free to share your screen if you have slides or visuals</li>
      <li>Please join a few minutes early to test your microphone and camera</li>
    </ul>

    <p style="font-size: 15px; color: #374151; line-height: 1.7;">
      If you have any questions or need to reschedule, please join our server with the link above and raise a ticket.
    </p>

    <p style="font-size: 15px; color: #374151; line-height: 1.7; margin-top: 28px;">
      We look forward to meeting you.
    </p>

    <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 14px; color: #1f2937; margin: 0;">Warm regards,</p>
      <p style="font-size: 15px; color: #111827; font-weight: 700; margin: 4px 0 0 0;">${hrName}</p>
      <p style="font-size: 13px; color: #6b7280; margin: 2px 0 0 0;">HR Team, Loran EduHub</p>
    </div>
  </div>

  <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
    This is an automated invitation sent on behalf of Loran EduHub's recruitment team.
  </p>
</div>
`.trim()
}