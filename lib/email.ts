// lib/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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


// lib/email.ts (add this function)
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
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: adminEmail,
    subject: `New Tutor Application: ${data.tutorName}`,
    html,
  });
}