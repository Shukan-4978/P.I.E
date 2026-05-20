const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to SendGrid, AWS SES, etc.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
    },
  });
};

const sendEmailOTP = async (to, code) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log(`[MOCK EMAIL] OTP for ${to}: ${code}`);
    return true; // Fallback to mock if no credentials
  }

  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"P.I.E Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your P.I.E Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #8b5cf6; text-align: center;">Welcome to P.I.E!</h2>
        <p style="color: #333; font-size: 16px;">Hello,</p>
        <p style="color: #333; font-size: 16px;">Please use the following 6-digit code to verify your email address. This code will expire in 10 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111; padding: 10px 20px; background: #f3f4f6; border-radius: 8px;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send verification email.');
  }
};

module.exports = { sendEmailOTP };
