import nodemailer from 'nodemailer';

interface EmailConfig {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
}

// Check if SMTP is configured
function isSMTPConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Create email transporter if SMTP is configured
function createTransporter(): nodemailer.Transporter | null {
  if (!isSMTPConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, resetURL: string): Promise<void> {
  const transporter = createTransporter();
  
  if (!transporter) {
    // Log the reset URL to console for development
    console.log('\n=== PASSWORD RESET LINK ===');
    console.log(`Email: ${email}`);
    console.log(`Reset URL: ${resetURL}`);
    console.log('===========================\n');
    return;
  }

  const mailOptions = {
    from: process.env.FROM_EMAIL || process.env.SMTP_USER!,
    to: email,
    subject: 'Reset your Miximixology password',
    text: `
Hello,

You requested a password reset for your Miximixology account.

Click the link below to reset your password:
${resetURL}

This link will expire in 30 minutes for security reasons.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The Miximixology Team
    `.trim(),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your Miximixology account.</p>
        <p>
          <a href="${resetURL}" 
             style="background-color: #f2c40c; color: #161611; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Your Password
          </a>
        </p>
        <p><small>Or copy and paste this link: <br>${resetURL}</small></p>
        <p>This link will expire in 30 minutes for security reasons.</p>
        <p>If you didn't request this password reset, you can safely ignore this email.</p>
        <hr>
        <p><small>Best regards,<br>The Miximixology Team</small></p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to: ${email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Fallback to console logging
    console.log('\n=== PASSWORD RESET LINK (EMAIL FAILED) ===');
    console.log(`Email: ${email}`);
    console.log(`Reset URL: ${resetURL}`);
    console.log('==========================================\n');
  }
}