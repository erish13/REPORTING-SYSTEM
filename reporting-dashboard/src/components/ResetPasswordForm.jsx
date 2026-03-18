import React, { useState } from 'react';
import { authAPI } from '../services/api';

function ResetPasswordForm({ token, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await authAPI.resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: '80px auto', padding: 20, border: '1px solid #ddd', borderRadius: 10 }}>
      <h2>Set New Password</h2>
      {done ? (
        <>
          <p style={{ color: '#059669', marginBottom: 16 }}>
            ✅ Password updated successfully!
          </p>
          <button style={{ width: '100%', padding: 10 }} type="button" onClick={onSuccess}>
            Go to Login
          </button>
        </>
      ) : (
        <>
          {error && (
            <p style={{ color: '#dc2626', marginBottom: 12, fontSize: 13 }}>{error}</p>
          )}
          <form onSubmit={handleSubmit}>
            <input
              style={{ width: '100%', marginBottom: 10, padding: 10 }}
              type="password"
              placeholder="New password (min. 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <input
              style={{ width: '100%', marginBottom: 10, padding: 10 }}
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button style={{ width: '100%', padding: 10 }} type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default ResetPasswordForm;
