const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

/**
 * In-memory store for password-reset tokens.
 * Map<token, { email: string, expiresAt: number }>
 */
const resetTokens = new Map();

/** Remove a token from the store */
function consumeToken(token) {
  resetTokens.delete(token);
}

/** Purge expired tokens — runs every 10 minutes */
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of resetTokens) {
    if (now > entry.expiresAt) resetTokens.delete(token);
  }
}, 10 * 60 * 1000).unref(); // unref so it doesn't block process exit

/** Build a nodemailer transporter from env vars */
function createMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/** Persist the updated password hash back to .env (best-effort) */
function updateEnvFile(newHash) {
  const envPath = path.join(__dirname, '..', '.env');
  try {
    if (!fs.existsSync(envPath)) return;
    let content = fs.readFileSync(envPath, 'utf8');
    if (/^ADMIN_PASSWORD_HASH\s*=/m.test(content)) {
      content = content.replace(
        /^(ADMIN_PASSWORD_HASH\s*=).*/m,
        `$1${newHash}`
      );
    } else {
      content += `\nADMIN_PASSWORD_HASH=${newHash}`;
    }
    fs.writeFileSync(envPath, content, 'utf8');
  } catch (e) {
    console.error('Could not update .env file:', e.message);
  }
}

/**
 * Localhost + single-owner login
 * .env required:
 * ADMIN_EMAIL=...
 * ADMIN_PASSWORD_HASH=...
 * JWT_SECRET=...
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !adminPasswordHash || !jwtSecret) {
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    // deny all non-owner emails
    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, adminPasswordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: 1, email: adminEmail, role: 'ADMIN' },
      jwtSecret,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: 1, email: adminEmail, role: 'ADMIN' },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Generates a one-time reset token (valid 15 min) and emails a link.
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    // Always return success to avoid user-enumeration; only send if email matches
    if (email.toLowerCase() === adminEmail.toLowerCase()) {
      const emailHost = process.env.EMAIL_HOST;
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;

      if (!emailHost || !emailUser || !emailPass) {
        console.error('forgot-password: email server not configured (EMAIL_HOST / EMAIL_USER / EMAIL_PASS missing)');
        return res.status(500).json({ message: 'Email server is not configured. Contact your administrator.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
      resetTokens.set(token, { email: adminEmail, expiresAt });

      const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
      const resetLink = `${appUrl}?reset_token=${token}`;

      const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      const transporter = createMailTransporter();

      await transporter.sendMail({
        from,
        to: adminEmail,
        subject: 'Password Reset – Reporting System',
        text: `You requested a password reset.\n\nClick the link below to set a new password (valid for 15 minutes):\n\n${resetLink}\n\nIf you did not request this, ignore this email.`,
        html: `
          <p>You requested a password reset for the <strong>Reporting System</strong>.</p>
          <p>Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
          <p style="margin:24px 0">
            <a href="${resetLink}" style="background:#1e3a8a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
              Reset Password
            </a>
          </p>
          <p style="color:#666;font-size:12px">If you did not request this, you can safely ignore this email.</p>
        `,
      });
    }

    return res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('forgot-password error:', error);
    return res.status(500).json({ message: 'Failed to send reset email. Check email server configuration.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 * Validates the token and updates the admin password hash.
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const entry = resetTokens.get(token);
    if (!entry) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (Date.now() > entry.expiresAt) {
      consumeToken(token);
      return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
    }

    consumeToken(token);

    const newHash = await bcrypt.hash(newPassword, 12);

    // Update in-memory environment so the running server uses the new password immediately
    process.env.ADMIN_PASSWORD_HASH = newHash;

    // Persist to .env file so the new password survives restarts
    updateEnvFile(newHash);

    return res.json({ message: 'Password updated successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('reset-password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
