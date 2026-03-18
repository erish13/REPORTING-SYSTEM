import React, { useState } from 'react';
import { authAPI } from '../services/api';

function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: '80px auto', padding: 20, border: '1px solid #ddd', borderRadius: 10 }}>
      <h2>Forgot Password</h2>
      {sent ? (
        <>
          <p style={{ color: '#059669', marginBottom: 16 }}>
            ✅ If that email is registered, a password reset link has been sent. Check your inbox.
          </p>
          <button style={{ width: '100%', padding: 10 }} type="button" onClick={onBack}>
            Back to Login
          </button>
        </>
      ) : (
        <>
          <p style={{ color: '#6b7280', marginBottom: 16, fontSize: 13 }}>
            Enter the admin email address and we&apos;ll send a reset link.
          </p>
          <form onSubmit={handleSubmit}>
            <input
              style={{ width: '100%', marginBottom: 10, padding: 10 }}
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button style={{ width: '100%', padding: 10, marginBottom: 8 }} type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          <button
            style={{ width: '100%', padding: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: '#1e3a8a', textDecoration: 'underline', fontSize: 13 }}
            type="button"
            onClick={onBack}
          >
            Back to Login
          </button>
        </>
      )}
    </div>
  );
}

export default ForgotPasswordForm;
