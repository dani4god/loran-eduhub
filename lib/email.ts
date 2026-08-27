// lib/email.ts
import nodemailer from 'nodemailer';
import Student from '@/models/Student'
import SelfPacedStudent from '@/models/SelfPacedStudent'

// lib/email.ts - Add these exports at the top
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


// Keep all your existing sendEmail functions...
export async function sendPasswordResetEmail(data: {
  email: string;
  name: string;
  resetUrl: string;
  role: string;
}) {
  const roleColor = data.role === 'tutor' ? '#7C3AED' : '#2563EB';
  const roleName = data.role === 'tutor' ? 'Tutor' : 'Student';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          background: linear-gradient(135deg, ${roleColor} 0%, #4F46E5 100%);
          border-radius: 12px 12px 0 0;
        }
        .header h1 {
          color: white;
          margin: 0;
          font-size: 24px;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-top: none;
          border-radius: 0 0 12px 12px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: ${roleColor};
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 12px;
        }
        .warning {
          background: #FEF3C7;
          border-left: 4px solid #F59E0B;
          padding: 12px;
          margin: 20px 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Loran EduHub</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hello ${data.name},</p>
          <p>We received a request to reset the password for your ${roleName} account associated with <strong>${data.email}</strong>.</p>
          
          <div style="text-align: center;">
            <a href="${data.resetUrl}" class="button">Reset Password</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ This link will expire in 1 hour</strong>
          </div>
          
          <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
          
          <p>For security reasons, never share this link with anyone.</p>
          
          <hr style="margin: 20px 0;" />
          
          <p style="font-size: 14px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${data.resetUrl}" style="color: ${roleColor}; word-break: break-all;">${data.resetUrl}</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Loran EduHub. All rights reserved.</p>
          <p>Empowering education across Nigeria</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: data.email,
    subject: `Reset Your ${roleName} Password - Loran EduHub`,
    html,
  });
}


// lib/email.ts (updated sendTutorApprovalEmail function)
export async function sendTutorApprovalEmail(email: string, name: string, status: 'approved' | 'disapproved') {
  const isApproved = status === 'approved';
  const loginUrl = `${process.env.NEXTAUTH_URL}/auth/tutor/login`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Tutor Application ${status.toUpperCase()}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7C3AED 0%, #2563EB 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #7C3AED; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Loran EduHub</h1>
        </div>
        <div class="content">
          <h2>${isApproved ? 'Congratulations!' : 'Application Update'}</h2>
          <p>Dear ${name},</p>
          <p>Your tutor application has been <strong>${status}</strong>.</p>
          ${isApproved ? `
            <p>You can now log in to your tutor dashboard and start managing your students.</p>
            
            <p style="font-size:14px; color:#374151; line-height:1.7;">
              Please check the <strong>announcements channel on our Discord server</strong> for the schedule of a
              short onboarding session with one of our team members — this will get you in tune with our vision
              and goals, and up to speed with the functionalities available on your dashboard.
            </p>
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Login to Dashboard</a>
            </div>
            <p>If you have any questions, please contact our support team.</p>
          ` : `
            <p>If you have any questions about this decision, please contact our support team.</p>
          `}
          <p>Best regards,<br>Loran EduHub Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Loran EduHub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Tutor Application ${status.toUpperCase()} - Loran EduHub`,
    html,
  });
}
export async function sendTutorApplicationEmail(data: {
  tutorName: string;
  tutorEmail: string;
  tutorId: string;
  qualifications: any[];
  courses: string[];
  videoLink: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@loraneduhub.com';
  
  // Build the email content (same as before)
  const qualificationsList = data.qualifications
    .map(q => `<li>${q.degree} from ${q.institution} (${q.year})</li>`)
    .join('');
  
  const coursesList = data.courses.map(c => `<li>${c}</li>`).join('');
  
  const html = `
    <h2>New Tutor Application</h2>
    <p><strong>Name:</strong> ${data.tutorName}</p>
    <p><strong>Email:</strong> ${data.tutorEmail}</p>
    <p><strong>Tutor ID:</strong> ${data.tutorId}</p>
    
    <h3>Video Introduction:</h3>
    <p><a href="${data.videoLink}" target="_blank">Watch Video Introduction →</a></p>
    
    <h3>Qualifications:</h3>
    <ul>${qualificationsList}</ul>
    
    <h3>Courses:</h3>
    <ul>${coursesList}</ul>
    
    <p>
      <a href="${process.env.NEXTAUTH_URL}/admin/tutors/${data.tutorId}" 
         style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Review Application
      </a>
    </p>
  `;

  // Tutor's confirmation email content (simpler version)
  const tutorHtml = `
    <h2>Thank You for Your Tutor Application</h2>
    <p>Dear ${data.tutorName},</p>
    <p>Thank you for submitting your tutor application to Loran EduHub. We have received your application and our team will review it shortly.</p>
    
    <h3>Application Summary:</h3>
    <p><strong>Name:</strong> ${data.tutorName}</p>
    <p><strong>Email:</strong> ${data.tutorEmail}</p>
    
    <h3>Courses Selected:</h3>
    <ul>${coursesList}</ul>
    
    <p>You will receive a confirmation email once your application has been reviewed.</p>
    <p>If you have any questions, please contact our support team.</p>
    
    <p>Best regards,<br>Loran EduHub Team</p>
  `;

  // Send to admin
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: adminEmail,
    subject: `New Tutor Application: ${data.tutorName}`,
    html,
  });

  // Send confirmation to tutor
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: data.tutorEmail,  // Now using the tutor's email
    subject: `Tutor Application Received - Loran EduHub`,
    html: tutorHtml,
  });
}

// lib/email.ts — add alongside sendTutorApplicationEmail/sendTutorApprovalEmail

export async function sendBankUpdateOtpEmail(to: string, name: string, otp: string) {
  // Reuse whatever underlying transport your existing send*Email functions use.
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Your Loran EduHub verification code',
    html: `
      <p>Hi ${name},</p>
      <p>Use this code to confirm your bank detail update:</p>
      <h2 style="letter-spacing:4px;">${otp}</h2>
      <p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
    `,
  })
}

// lib/email.ts — add

export async function sendInterviewInviteEmail(to: string, html: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Interview Invitation — Loran EduHub Tutor Application',
    html,
  })
}

// lib/email.ts — add

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function sendNewsletterBatch(
  recipients: string[],
  subject: string,
  html: string
) {
  const BATCH_SIZE = 25;

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((to) =>
        transporter.sendMail({
          from: process.env.SMTP_FROM,
          to,
          subject,
          html,
        })
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        sent++;
      } else {
        failed++;
        console.error("Failed to send newsletter:", result.reason);
      }
    }

    // Pause 1 second before sending the next batch
    if (i + BATCH_SIZE < recipients.length) {
      await delay(1000);
    }
  }

  return { sent, failed };
}

export async function sendCourseRejectedEmail(
  tutorEmail: string, tutorName: string, courseTitle: string, reason: string
) {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
    <div style="background:#dc2626; padding:24px 32px; border-radius:12px 12px 0 0;">
      <p style="color:#fecaca; font-size:11px; letter-spacing:1px; text-transform:uppercase; margin:0 0 6px;">Loran EduHub</p>
      <h1 style="color:#fff; font-size:20px; margin:0;">Course Not Approved</h1>
    </div>
    <div style="padding:28px 32px; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 12px 12px;">
      <p style="font-size:14px; color:#1f2937;">Hi ${tutorName},</p>
      <p style="font-size:14px; color:#374151; line-height:1.7;">Your self-paced course <strong>"${courseTitle}"</strong> was reviewed but could not be approved at this time.</p>
      <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:16px 20px; margin:20px 0;">
        <p style="font-size:13px; color:#991b1b; margin:0;"><strong>Reason:</strong> ${reason}</p>
      </div>
      <p style="font-size:14px; color:#374151; line-height:1.7;">You can make the necessary changes and resubmit the course for review from your tutor dashboard.</p>
    </div>
  </div>`
  await transporter.sendMail({ from: process.env.SMTP_FROM, to: tutorEmail,  subject: `Course Update: "${courseTitle}" needs changes`, html })
}

export async function sendCourseApprovedEmail(
  tutorEmail: string, tutorName: string, courseTitle: string, publicUrl: string
) {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
    <div style="background:linear-gradient(135deg,#16a34a,#059669); padding:24px 32px; border-radius:12px 12px 0 0;">
      <p style="color:#bbf7d0; font-size:11px; letter-spacing:1px; text-transform:uppercase; margin:0 0 6px;">Loran EduHub</p>
      <h1 style="color:#fff; font-size:20px; margin:0;">Course Approved & Live!</h1>
    </div>
    <div style="padding:28px 32px; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 12px 12px;">
      <p style="font-size:14px; color:#1f2937;">Hi ${tutorName},</p>
      <p style="font-size:14px; color:#374151; line-height:1.7;">Great news — your self-paced course <strong>"${courseTitle}"</strong> has been approved and is now live for students to purchase.</p>
      <div style="text-align:center; margin:24px 0;">
        <a href="${publicUrl}" style="display:inline-block; padding:12px 24px; background:#16a34a; color:#fff; font-weight:600; font-size:14px; text-decoration:none; border-radius:8px;">View Your Course</a>
      </div>
      <p style="font-size:13px; color:#6b7280;">Share this link on your social media pages to attract more students:</p>
      <p style="font-size:13px; color:#2563eb; word-break:break-all;">${publicUrl}</p>
    </div>
  </div>`
  await transporter.sendMail({ from: process.env.SMTP_FROM, to: tutorEmail,  subject: `Your course "${courseTitle}" is now live!`, html })
}

// Notifies EVERY student — regular and self-paced — that a new self-paced
// course just went live. Uses the same batched sender built for the admin
// newsletter feature, since this is effectively the same operation (one
// email, many recipients).
export async function notifyAllStudentsOfNewCourse(
  courseTitle: string, tutorName: string, description: string, publicUrl: string
) {
  const [students, spStudents] = await Promise.all([
    Student.find({}).populate('userId', 'email'),
    SelfPacedStudent.find({}).populate('userId', 'email'),
  ])

  const emails = [
    ...students.map((s: any) => s.userId?.email).filter(Boolean),
    ...spStudents.map((s: any) => s.userId?.email).filter(Boolean),
  ]
  const uniqueEmails = [...new Set(emails)] as string[]
  if (uniqueEmails.length === 0) return

  const html = `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
    <div style="background:linear-gradient(135deg,#2563eb,#4338ca); padding:24px 32px; border-radius:12px 12px 0 0;">
      <p style="color:#bfdbfe; font-size:11px; letter-spacing:1px; text-transform:uppercase; margin:0 0 6px;">Loran EduHub</p>
      <h1 style="color:#fff; font-size:20px; margin:0;">New Course Available!</h1>
    </div>
    <div style="padding:28px 32px; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 12px 12px;">
      <h2 style="font-size:18px; color:#111827; margin:0 0 6px;">${courseTitle}</h2>
      <p style="font-size:13px; color:#6b7280; margin:0 0 14px;">by ${tutorName}</p>
      <p style="font-size:14px; color:#374151; line-height:1.7;">${description || 'A brand new self-paced course is now available on Loran EduHub.'}</p>
      <div style="text-align:center; margin:24px 0;">
        <a href="${publicUrl}" style="display:inline-block; padding:12px 24px; background:#2563eb; color:#fff; font-weight:600; font-size:14px; text-decoration:none; border-radius:8px;">View Course</a>
      </div>
    </div>
  </div>`

  await sendNewsletterBatch(uniqueEmails, `New Course: ${courseTitle}`, html)
}


export async function sendLessonNoteRejectedEmail(tutorEmail: string, tutorName: string, title: string, reason: string) {
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:#dc2626;padding:24px 32px;border-radius:12px 12px 0 0;">
      <p style="color:#fecaca;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Loran EduHub</p>
      <h1 style="color:#fff;font-size:20px;margin:0;">Lesson Note Not Approved</h1>
    </div>
    <div style="padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
      <p style="font-size:14px;color:#1f2937;">Hi ${tutorName},</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;">Your lesson note <strong>"${title}"</strong> could not be approved.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin:20px 0;">
        <p style="font-size:13px;color:#991b1b;margin:0;"><strong>Reason:</strong> ${reason}</p>
      </div>
      <p style="font-size:14px;color:#374151;">You can edit and resubmit it from your dashboard.</p>
    </div></div>`
  await transporter.sendMail({ from: process.env.SMTP_FROM, to: tutorEmail, subject: `Lesson Note Update: "${title}" needs changes`, html })
}

export async function sendLessonNoteApprovedEmail(tutorEmail: string, tutorName: string, title: string, publicUrl: string) {
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#16a34a,#059669);padding:24px 32px;border-radius:12px 12px 0 0;">
      <p style="color:#bbf7d0;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Loran EduHub</p>
      <h1 style="color:#fff;font-size:20px;margin:0;">Lesson Note Approved & Live!</h1>
    </div>
    <div style="padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
      <p style="font-size:14px;color:#1f2937;">Hi ${tutorName},</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;">Your lesson note <strong>"${title}"</strong> is now live and available for purchase.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${publicUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;">View Listing</a>
      </div>
    </div></div>`
  await transporter.sendMail({ from: process.env.SMTP_FROM, to: tutorEmail, subject: `Your lesson note "${title}" is now live!`, html })
}