const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { sendResetEmail } = require('../utils/email');
const { updateEnvVariable } = require('../utils/envUpdater');

const router = express.Router();

// In-memory OTP storage: { email: { otp: '123456', expiresAt: timestamp } }
const otpStore = {};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

// Generate 6-digit OTP
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Clean up expired OTPs
function cleanExpiredOTPs() {
  const now = Date.now();
  Object.keys(otpStore).forEach((email) => {
    if (otpStore[email].expiresAt < now) {
      delete otpStore[email];
    }
  });
}

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  const normalizedEmail = normalizeEmail(email);
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Email is required' });
  }

  if (!adminEmail) {
    return res.status(500).json({ message: 'Server misconfiguration' });
  }

  if (normalizedEmail !== normalizeEmail(adminEmail)) {
    return res.status(200).json({
      message: 'If that email is registered, reset instructions will be sent shortly.',
    });
  }

  const otp = generateOTP();
  const expiresInMinutes = Number(process.env.RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES || 15);
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

  otpStore[normalizedEmail] = { otp, expiresAt };

  try {
    await sendResetEmail({
      to: adminEmail,
      otp,
      expiresInMinutes,
    });
    return res.status(200).json({ message: 'Reset code has been sent to your email.' });
  } catch (error) {
    console.error('Forgot password email error:', error);
    return res.status(500).json({ message: 'Unable to send reset code right now.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { otp, password } = req.body || {};
  const adminEmail = process.env.ADMIN_EMAIL;

  cleanExpiredOTPs();

  if (!otp || !password) {
    return res.status(400).json({ message: 'OTP and new password are required' });
  }

  if (!adminEmail) {
    return res.status(500).json({ message: 'Server misconfiguration' });
  }

  const normalizedEmail = normalizeEmail(adminEmail);
  const storedData = otpStore[normalizedEmail];

  if (!storedData) {
    return res.status(400).json({ message: 'No reset code requested. Please request a new one.' });
  }

  if (storedData.otp !== String(otp).trim()) {
    return res.status(400).json({ message: 'Invalid reset code' });
  }

  if (storedData.expiresAt < Date.now()) {
    delete otpStore[normalizedEmail];
    return res.status(400).json({ message: 'Reset code expired. Please request a new one.' });
  }

  const normalizedPassword = String(password).trim();
  
  // Password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(normalizedPassword)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&)',
    });
  }

  try {
    const hashed = await bcrypt.hash(normalizedPassword, 12);
    updateEnvVariable('ADMIN_PASSWORD_HASH', hashed);
    process.env.ADMIN_PASSWORD_HASH = hashed;
    delete otpStore[normalizedEmail];
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Unable to update password right now' });
  }
});

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

    if (normalizeEmail(email) !== normalizeEmail(adminEmail)) {
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

module.exports = router;
