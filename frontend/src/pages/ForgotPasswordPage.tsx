import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { buildApiUrl } from '../lib/api/baseUrl';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(buildApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to request password reset');
        return;
      }

      setMessage(
        data.message ||
          'Password reset instructions have been sent to your email. Please check your email for the reset link.'
      );
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 data-testid="forgot-password-title">Reset Password</h1>
        <p>Enter your email address and we&apos;ll send you a token to reset your password.</p>

        <form onSubmit={handleSubmit} className="auth-form" data-testid="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              required
              autoComplete="email"
              disabled={loading}
              data-testid="forgot-password-email"
            />
          </div>

          {error && (
            <div className="error" data-testid="forgot-password-error">
              {error}
            </div>
          )}
          {message && (
            <div className="success" data-testid="forgot-password-success">
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} data-testid="forgot-password-submit">
            {loading ? 'Sending...' : 'Send Reset Token'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login" data-testid="back-to-login">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
