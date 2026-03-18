import React, { useState } from 'react';
import { authAPI } from '../services/api';

function ResetPasswordForm({ onBack }) {
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [resetOTP, setResetOTP] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation helpers
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const hasMinLength = resetPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(resetPassword);
  const hasLowercase = /[a-z]/.test(resetPassword);
  const hasNumber = /\d/.test(resetPassword);
  const hasSpecial = /[@$!%*?&]/.test(resetPassword);
  const isPasswordValid = passwordRegex.test(resetPassword);
  const passwordsMatch = resetPassword && resetPassword === resetPasswordConfirm;

  const handleRequestReset = async (e) => {
    e.preventDefault();
    const value = forgotEmail.trim();
    setForgotMessage('');
    setForgotError('');

    if (!value) {
      setForgotError('Please enter your email address');
      return;
    }

    try {
      setForgotLoading(true);
      await authAPI.forgotPassword(value);
      setForgotMessage('6-digit code has been sent to your email');
      setForgotEmail('');
    } catch (error) {
      setForgotError(error?.response?.data?.message || 'Failed to send reset code');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleApplyReset = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setResetError('');

    if (!resetOTP.trim()) {
      setResetError('Please enter the 6-digit code');
      return;
    }

    if (resetOTP.trim().length !== 6 || !/^\d+$/.test(resetOTP.trim())) {
      setResetError('Code must be exactly 6 digits');
      return;
    }

    if (!resetPassword) {
      setResetError('Please enter a new password');
      return;
    }

    if (resetPassword !== resetPasswordConfirm) {
      setResetError('Passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setResetError(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&)',
      );
      return;
    }

    try {
      setResetLoading(true);
      await authAPI.resetPassword(resetOTP.trim(), resetPassword);
      setResetMessage('Password updated successfully. Redirecting to login...');
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      setResetError(error?.response?.data?.message || 'Unable to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f8f5 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          padding: 40,
          maxWidth: 420,
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#1b5e3f',
              marginBottom: 10,
            }}
          >
            🔐
          </div>
          <h1
            style={{
              margin: '0 0 8px 0',
              color: '#1b5e3f',
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            Reset Password
          </h1>
          <p style={{ margin: '0', color: '#666', fontSize: 14 }}>
            Enter your email to receive a reset code
          </p>
        </div>

        {!forgotMessage && (
          <form onSubmit={handleRequestReset}>
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 6,
                  color: '#333',
                  fontWeight: 500,
                  fontSize: 14,
                }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your admin email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1.5px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1b5e3f';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                }}
              />
            </div>

            {forgotError && (
              <div
                style={{
                  background: '#fee',
                  color: '#c33',
                  padding: 12,
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 13,
                  border: '1px solid #fcc',
                }}
              >
                {forgotError}
              </div>
            )}

            <button
              type="submit"
              disabled={forgotLoading}
              style={{
                width: '100%',
                padding: 12,
                background: forgotLoading ? '#999' : '#1b5e3f',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 15,
                fontWeight: 600,
                cursor: forgotLoading ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s',
              }}
              onMouseEnter={(e) => {
                if (!forgotLoading) e.target.style.background = '#145a36';
              }}
              onMouseLeave={(e) => {
                if (!forgotLoading) e.target.style.background = '#1b5e3f';
              }}
            >
              {forgotLoading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {forgotMessage && (
          <div>
            <div
              style={{
                background: '#efe',
                color: '#3a3',
                padding: 12,
                borderRadius: 6,
                marginBottom: 24,
                fontSize: 13,
                border: '1px solid #cfc',
                textAlign: 'center',
              }}
            >
              ✓ {forgotMessage}
            </div>

            <form onSubmit={handleApplyReset}>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    color: '#333',
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  Verification Code
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={resetOTP}
                  onChange={(e) => setResetOTP(e.target.value.slice(0, 6))}
                  maxLength="6"
                  inputMode="numeric"
                  required
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1.5px solid #e0e0e0',
                    borderRadius: 6,
                    fontSize: 18,
                    textAlign: 'center',
                    letterSpacing: 8,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1b5e3f';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    color: '#333',
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 12px',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1b5e3f';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#1b5e3f',
                      fontSize: 18,
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showPassword ? (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </>
                      ) : (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                
                {resetPassword && (
                  <div style={{ marginTop: 12, fontSize: 13 }}>
                    <p style={{ margin: '0 0 8px 0', color: '#666', fontWeight: 500 }}>
                      Password requirements:
                    </p>
                    <div
                      style={{
                        color: hasMinLength ? '#3a3' : '#ccc',
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{hasMinLength ? '✓' : '✗'}</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div
                      style={{
                        color: hasUppercase ? '#3a3' : '#ccc',
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{hasUppercase ? '✓' : '✗'}</span>
                      <span>Uppercase letter (A-Z)</span>
                    </div>
                    <div
                      style={{
                        color: hasLowercase ? '#3a3' : '#ccc',
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{hasLowercase ? '✓' : '✗'}</span>
                      <span>Lowercase letter (a-z)</span>
                    </div>
                    <div
                      style={{
                        color: hasNumber ? '#3a3' : '#ccc',
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{hasNumber ? '✓' : '✗'}</span>
                      <span>Number (0-9)</span>
                    </div>
                    <div
                      style={{
                        color: hasSpecial ? '#3a3' : '#ccc',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{hasSpecial ? '✓' : '✗'}</span>
                      <span>Special character (@$!%*?&)</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    color: '#333',
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={resetPasswordConfirm}
                    onChange={(e) => setResetPasswordConfirm(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 12px',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1b5e3f';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#1b5e3f',
                      fontSize: 18,
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showConfirmPassword ? (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </>
                      ) : (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {resetError && (
                <div
                  style={{
                    background: '#fee',
                    color: '#c33',
                    padding: 12,
                    borderRadius: 6,
                    marginBottom: 16,
                    fontSize: 13,
                    border: '1px solid #fcc',
                  }}
                >
                  {resetError}
                </div>
              )}

              {resetMessage && (
                <div
                  style={{
                    background: '#efe',
                    color: '#3a3',
                    padding: 12,
                    borderRadius: 6,
                    marginBottom: 16,
                    fontSize: 13,
                    border: '1px solid #cfc',
                  }}
                >
                  ✓ {resetMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                style={{
                  width: '100%',
                  padding: 12,
                  background: resetLoading ? '#999' : '#1b5e3f',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.3s',
                }}
                onMouseEnter={(e) => {
                  if (!resetLoading) e.target.style.background = '#145a36';
                }}
                onMouseLeave={(e) => {
                  if (!resetLoading) e.target.style.background = '#1b5e3f';
                }}
              >
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#1b5e3f',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordForm;
