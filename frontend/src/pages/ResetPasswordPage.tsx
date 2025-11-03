import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate inputs
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setMessage(data.message || 'Password has been reset successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error('Reset password error:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h1 data-testid="reset-password-title">Invalid Reset Link</h1>
          <p>The password reset link is invalid or has expired.</p>
          <div className="auth-links">
            <Link to="/forgot-password">Request New Reset Token</Link>
            <br />
            <Link to="/login">← Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 data-testid="reset-password-title">Reset Your Password</h1>
        <p>Enter your new password below.</p>
        
        <form onSubmit={handleSubmit} className="auth-form" data-testid="reset-password-form">
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
              required
              autoComplete="new-password"
              disabled={loading}
              minLength={8}
              data-testid="reset-password-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirm new password"
              required
              autoComplete="new-password"
              disabled={loading}
              minLength={8}
              data-testid="reset-password-confirm"
            />
          </div>
          
          {error && <div className="error" data-testid="reset-password-error">{error}</div>}
          {message && <div className="success" data-testid="reset-password-success">{message}</div>}
          
          <button type="submit" disabled={loading} data-testid="reset-password-submit">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="auth-links">
          <Link to="/login" data-testid="back-to-login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;