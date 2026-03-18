import React, { useState } from 'react';
import { authAPI } from '../services/api';
import ForgotPasswordForm from './ForgotPasswordForm';

function LoginForm({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authAPI.login(email, password);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onSuccess?.(res.data.user);
    } catch (error) {
      alert(error?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (showForgot) {
    return <ForgotPasswordForm onBack={() => setShowForgot(false)} />;
  }

  return (
    <div style={{ maxWidth: 380, margin: '80px auto', padding: 20, border: '1px solid #ddd', borderRadius: 10 }}>
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          style={{ width: '100%', marginBottom: 10, padding: 10 }}
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={{ width: '100%', marginBottom: 10, padding: 10 }}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button style={{ width: '100%', padding: 10, marginBottom: 8 }} type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
      <button
        style={{ width: '100%', padding: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: '#1e3a8a', textDecoration: 'underline', fontSize: 13 }}
        type="button"
        onClick={() => setShowForgot(true)}
      >
        Forgot Password?
      </button>
    </div>
  );
}

export default LoginForm;