import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 data-testid="login-title">Login to Farmers Boot</h1>
        <form onSubmit={handleSubmit} className="auth-form" data-testid="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              required
              autoComplete="email"
              disabled={loading}
              data-testid="login-email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              disabled={loading}
              data-testid="login-password"
            />
          </div>
          {error && (
            <div className="error" data-testid="login-error">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} data-testid="login-submit-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <div className="form-links">
            <a href="/forgot-password" data-testid="forgot-password-link">
              Forgot your password?
            </a>
          </div>
        </form>
        <p>
          Don&apos;t have an account?{' '}
          <a href="/signup" data-testid="signup-link">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
