// API/helpers/email.js
const { generateVerificationEmailHTML } = require('../Resent/EmailTemplate');
const { generateResetPasswordEmailHTML } = require('../Resent/ResetPasswordEmailTemplate');

// 使用 Resend API 发送验证码邮件
async function sendVerificationEmail(toEmail, verificationCode) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.error('[email] RESEND_API_KEY not found in environment variables');
    throw new Error('Email service not configured');
  }

  // 使用全局 fetch（Node 18+）或 require node-fetch
  let fetchFn = globalThis.fetch;
  if (!fetchFn) {
    try {
      fetchFn = require('node-fetch');
    } catch (e) {
      console.error('[email] fetch not available; install node-fetch or use Node 18+');
      throw e;
    }
  }

  const html = generateVerificationEmailHTML(verificationCode);
  const from = process.env.EMAIL_FROM || 'CanLifeHub <onboarding@resend.dev>';

  try {
    const resp = await fetchFn('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: toEmail,
        subject: 'CanLifeHub — 邮箱验证码',
        html,
      }),
    });

    const data = await resp.json();
    
    if (!resp.ok) {
      console.error('[email] Resend API error:', data);
      throw new Error(data.message || 'Failed to send email');
    }

    console.log('[email] Verification email sent successfully:', data.id);
    return data;
  } catch (err) {
    console.error('[email] Failed to send verification email:', err);
    throw err;
  }
}

// 使用 Resend API 发送密码重置邮件
async function sendResetPasswordEmail(toEmail, resetLink) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.error('[email] RESEND_API_KEY not found in environment variables');
    throw new Error('Email service not configured');
  }

  let fetchFn = globalThis.fetch;
  if (!fetchFn) {
    try {
      fetchFn = require('node-fetch');
    } catch (e) {
      console.error('[email] fetch not available; install node-fetch or use Node 18+');
      throw e;
    }
  }

  const html = generateResetPasswordEmailHTML(resetLink);
  const from = process.env.EMAIL_FROM || 'CanLifeHub <onboarding@resend.dev>';

  try {
    const resp = await fetchFn('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: toEmail,
        subject: 'CanLifeHub — 重置密码',
        html,
      }),
    });

    const data = await resp.json();
    
    if (!resp.ok) {
      console.error('[email] Resend API error:', data);
      throw new Error(data.message || 'Failed to send email');
    }

    console.log('[email] Reset password email sent successfully:', data.id);
    return data;
  } catch (err) {
    console.error('[email] Failed to send reset password email:', err);
    throw err;
  }
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
