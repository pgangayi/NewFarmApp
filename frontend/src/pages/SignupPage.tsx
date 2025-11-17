import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const { error: signupError } = await signUp(email, password, name);

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
    } else {
      // User is already logged in, redirect to farms
      navigate('/farms');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 data-testid="signup-title">Sign up for Farmers Boot</h1>
        <form onSubmit={handleSubmit} className="auth-form" data-testid="signup-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Enter your name"
              required
              disabled={loading}
              data-testid="signup-name"
            />
          </div>
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
              data-testid="signup-email"
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
              autoComplete="new-password"
              disabled={loading}
              data-testid="signup-password"
            />
          </div>
          {error && (
            <div className="error" data-testid="signup-error">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} data-testid="signup-submit-button">
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
        <p>
          Already have an account?{' '}
          <a href="/login" data-testid="login-link">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;
