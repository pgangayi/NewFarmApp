import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  useTheme,
} from '@mui/material';
import { Agriculture } from '@mui/icons-material';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

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
      const data = await apiClient.post<{ message: string }>('/api/auth/forgot-password', {
        email,
      });

      setMessage(
        data.message ||
          'Password reset instructions have been sent to your email. Please check your email for the reset link.'
      );
    } catch (err: any) {
      console.error('Forgot password error:', err);
      // apiClient throws an Error with the message from the server response (error.message)
      setError(err.message || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            boxShadow: 3,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: { xs: 4, md: 6 } }}>
            <Box textAlign="center" mb={4}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Agriculture fontSize="large" />
              </Avatar>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                Reset Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Enter your email address and we&apos;ll send you a token to reset your password.
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
                data-testid="forgot-password-email"
                sx={{ mb: 3 }}
              />

              {error && (
                <Alert severity="error" sx={{ mb: 3 }} data-testid="forgot-password-error">
                  {error}
                </Alert>
              )}

              {message && (
                <Alert severity="success" sx={{ mb: 3 }} data-testid="forgot-password-success">
                  {message}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mb: 3,
                  py: 1.5,
                  bgcolor: 'grey.900',
                  '&:hover': { bgcolor: 'grey.800' },
                }}
                data-testid="forgot-password-submit"
              >
                {loading ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} color="inherit" />
                    Sending...
                  </Box>
                ) : (
                  'Send Reset Token'
                )}
              </Button>
            </Box>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                <Link
                  to="/login"
                  style={{
                    textDecoration: 'none',
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  }}
                  data-testid="back-to-login"
                >
                  ← Back to Login
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default ForgotPasswordPage;
