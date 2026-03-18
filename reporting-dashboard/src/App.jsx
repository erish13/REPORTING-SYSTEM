import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LoginForm from './components/LoginForm';
import ResetPasswordForm from './components/ResetPasswordForm';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [showResetPassword, setShowResetPassword] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    if (showResetPassword) {
      return <ResetPasswordForm onBack={() => setShowResetPassword(false)} />;
    }
    return (
      <LoginForm
        onSuccess={() => setIsAuthenticated(true)}
        onForgotPassword={() => setShowResetPassword(true)}
      />
    );
  }

  return <Dashboard onLogout={logout} />;
}

export default App;