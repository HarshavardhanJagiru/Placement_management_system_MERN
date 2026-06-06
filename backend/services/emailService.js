import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const logEmailEvent = (message) => {
  const logMsg = `${new Date().toLocaleString()}: ${message}\n`;
  try {
    fs.appendFileSync(path.join(process.cwd(), 'email_log.txt'), logMsg);
  } catch (err) {
    try {
      fs.appendFileSync(path.join(process.cwd(), '../email_log.txt'), logMsg);
    } catch (e) {
      console.error('Failed to write email log', e);
    }
  }
};

const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL || 'reply.not.for.this.mail@gmail.com',
      pass: process.env.SMTP_PASSWORD || 'vmlu ctyy gajk hlar'
    }
  });
};

const sendHtmlEmail = async (receiverEmail, subject, htmlBody) => {
  logEmailEvent(`Attempting mail to ${receiverEmail} | Subject: ${subject}`);
  const transporter = getTransporter();
  
  const mailOptions = {
    from: `"Placement Tracker" <${process.env.SMTP_EMAIL || 'reply.not.for.this.mail@gmail.com'}>`,
    to: receiverEmail,
    subject: subject,
    html: htmlBody
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`SUCCESS: Email sent to ${receiverEmail} (${info.messageId})`);
    logEmailEvent(`SUCCESS: Mail sent to ${receiverEmail}`);
    return true;
  } catch (error) {
    const errorMsg = `Failed to send email to ${receiverEmail}: ${error.message}`;
    console.error(errorMsg);
    logEmailEvent(`FAIL: ${errorMsg}`);
    return false;
  }
};

export const sendOtpEmail = async (receiverEmail, otpCode) => {
  const subject = "Your Placement Tracker Verification Code";
  const htmlBody = `
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 24px;">Welcome to Placement Tracker!</h2>
          </div>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">Thank you for registering. Please use the following One-Time Password (OTP) to verify your stunning new dashboard account.</p>
          <div style="text-align: center; margin: 35px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #1e293b; background: #f1f5f9; padding: 15px 30px; border-radius: 12px; border: 1px solid #e2e8f0;">${otpCode}</span>
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: center;">This code will expire in exactly 15 minutes.</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you didn't request this email, please ignore it.</p>
        </div>
      </body>
    </html>
  `;
  return await sendHtmlEmail(receiverEmail, subject, htmlBody);
};

export const sendInterviewAlert = async (receiverEmail, studentName, company, position, dateTime) => {
  const subject = `Interview Scheduled: ${position} at ${company}`;
  const htmlBody = `
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 4px solid #4f46e5;">
          <h2 style="color: #1e293b; margin-top: 0;">Hi ${studentName}, 🎉</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">Great news! An interview has been scheduled for your application.</p>
          <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #64748b; padding-bottom: 10px;">Company:</td><td style="color: #1e293b; font-weight: bold; padding-bottom: 10px;">${company}</td></tr>
              <tr><td style="color: #64748b; padding-bottom: 10px;">Position:</td><td style="color: #1e293b; font-weight: bold; padding-bottom: 10px;">${position}</td></tr>
              <tr><td style="color: #64748b;">Schedule:</td><td style="color: #4f46e5; font-weight: bold;">${dateTime}</td></tr>
            </table>
          </div>
          <p style="color: #475569; font-size: 16px;">Please be prepared and log in to your dashboard for more details.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background: #4f46e5; color: white; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: bold; display: inline-block;">Go to Dashboard</a>
          </div>
        </div>
      </body>
    </html>
  `;
  return await sendHtmlEmail(receiverEmail, subject, htmlBody);
};

export const sendInterviewReminder = async (receiverEmail, studentName, company, position, dateTime) => {
  const subject = `Friendly Reminder: Interview at ${company} tomorrow`;
  const htmlBody = `
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #fffbeb; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 4px solid #f59e0b;">
          <h2 style="color: #1e293b; margin-top: 0;">Hi ${studentName}, 👋</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">This is a friendly reminder for your upcoming interview tomorrow.</p>
          <div style="background: #fffbeb; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #fef3c7;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #92400e; padding-bottom: 10px;">Company:</td><td style="color: #1e293b; font-weight: bold; padding-bottom: 10px;">${company}</td></tr>
              <tr><td style="color: #92400e; padding-bottom: 10px;">Position:</td><td style="color: #1e293b; font-weight: bold; padding-bottom: 10px;">${position}</td></tr>
              <tr><td style="color: #92400e;">When:</td><td style="color: #b45309; font-weight: bold;">${dateTime}</td></tr>
            </table>
          </div>
          <p style="color: #475569; font-size: 16px;">Good luck! We believe in you.</p>
        </div>
      </body>
    </html>
  `;
  return await sendHtmlEmail(receiverEmail, subject, htmlBody);
};

export const sendResetOtpEmail = async (receiverEmail, otpCode) => {
  const subject = "Password Reset Verification Code";
  const htmlBody = `
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 4px solid #ef4444;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #ef4444; margin: 0; font-size: 24px;">Password Reset Request</h2>
          </div>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Please use the following One-Time Password (OTP) to proceed with the reset.</p>
          <div style="text-align: center; margin: 35px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #1e293b; background: #f1f5f9; padding: 15px 30px; border-radius: 12px; border: 1px solid #e2e8f0;">${otpCode}</span>
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: center;">This code will expire in exactly 15 minutes.</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
      </body>
    </html>
  `;
  return await sendHtmlEmail(receiverEmail, subject, htmlBody);
};

export const sendCustomEmail = async (receiverEmail, subject, bodyText) => {
  const htmlBody = `
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 4px solid #4f46e5;">
          <h2 style="color: #1e293b; margin-top: 0;">Placement Update</h2>
          <div style="color: #475569; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
            ${bodyText}
          </div>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated message from the Placement Management System.</p>
        </div>
      </body>
    </html>
  `;
  return await sendHtmlEmail(receiverEmail, subject, htmlBody);
};
