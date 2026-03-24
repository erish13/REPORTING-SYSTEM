import React, { useState } from 'react';
import { authAPI } from '../services/api';

function LoginForm({ onSuccess, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const res = await authAPI.login(email, password);
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      onSuccess?.(res.data.user);
    } catch (error) {
      setError(error?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
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
            🌿
          </div>
          <h1
            style={{
              margin: '0 0 8px 0',
              color: '#1b5e3f',
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            Admin Dashboard
          </h1>
          <p style={{ margin: '0', color: '#666', fontSize: 14 }}>
            Environmental Guarantee & Activity Permit
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: 12,
                border: '1.5px solid #e0e0e0',
                borderRadius: 6,
                fontSize: 14,
                boxSizing: 'border-box',
                transition: 'border-color 0.3s',
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
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 12px',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s',
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
          </div>

          {error && (
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
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              background: loading ? '#999' : '#1b5e3f',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
              marginTop: 8,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.background = '#145a36';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.background = '#1b5e3f';
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            type="button"
            onClick={onForgotPassword}
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
            Forgot password?
          </button>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: 20,
            color: '#999',
            fontSize: 12,
          }}
        >
          Admin access only
        </p>
      </div>
    </div>
  );
}

export default LoginForm;
