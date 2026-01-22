import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, CheckCircle, AlertCircle, UserPlus, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/AuthContext';

interface InviteDetails {
  id: string;
  farm_name: string;
  farm_location?: string;
  role: string;
  message?: string;
  inviter_name: string;
  inviter_email: string;
  created_at: string;
  expires_at: string;
}

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [inviteStatus, setInviteStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'accepted'>('loading');
  const [message, setMessage] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (token) {
      validateInvite();
    } else {
      setInviteStatus('invalid');
      setMessage('No invitation token provided');
      setIsLoading(false);
    }
  }, [token]);

  const validateInvite = async () => {
    try {
      // For now, we'll need to decode the token or make an API call to get invite details
      // Since we don't have a direct endpoint to get invite by token, we'll proceed with acceptance
      setInviteStatus('valid');
      setIsLoading(false);
    } catch (error) {
      setInviteStatus('invalid');
      setMessage('Invalid invitation token');
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!token) {
      setInviteStatus('invalid');
      setMessage('No invitation token provided');
      return;
    }

    // If user is not logged in, show signup form
    if (!user) {
      setShowSignup(true);
      return;
    }

    setIsAccepting(true);
    setInviteStatus('loading');

    try {
      const response = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteStatus('accepted');
        setMessage(`Successfully joined ${data.farm_name}!`);
        
        // Redirect to dashboard after delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setInviteStatus('invalid');
        setMessage(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      setInviteStatus('invalid');
      setMessage('Network error. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSignupAndAccept = async () => {
    const { name, email, password, confirmPassword } = signupData;

    if (!name || !email || !password) {
      setMessage('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long');
      return;
    }

    setIsAccepting(true);

    try {
      // First signup the user
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        setMessage(signupData.error || 'Signup failed');
        setIsAccepting(false);
        return;
      }

      // Login the user
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        setMessage('Account created but login failed. Please try logging in manually.');
        setIsAccepting(false);
        return;
      }

      // Store tokens and update auth context
      localStorage.setItem('access_token', loginData.access_token);
      localStorage.setItem('refresh_token', loginData.refresh_token);
      await login(loginData.user);

      // Now accept the invite
      await handleAcceptInvite();
    } catch (error) {
      setMessage('Network error. Please try again.');
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
          <p className="mt-2 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (showSignup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <UserPlus className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Create Account to Join
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Create an account to accept the farm invitation
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>
                Join the farm team with your new account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  placeholder="Enter your full name"
                  disabled={isAccepting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  placeholder="Enter your email"
                  disabled={isAccepting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  placeholder="Create a password (min 8 characters)"
                  disabled={isAccepting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  disabled={isAccepting}
                />
              </div>

              <Button
                onClick={handleSignupAndAccept}
                disabled={isAccepting}
                className="w-full"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account & Joining...
                  </>
                ) : (
                  'Create Account & Join Farm'
                )}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-600"
                >
                  Already have an account? Login first
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Farm Invitation
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited to join a farm team
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {inviteStatus === 'accepted' ? 'Invitation Accepted!' : 'Accept Invitation'}
            </CardTitle>
            <CardDescription>
              {inviteStatus === 'accepted' 
                ? 'You have successfully joined the farm team'
                : 'Review the invitation details below'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inviteStatus === 'accepted' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {inviteStatus === 'invalid' && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {inviteStatus === 'valid' && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Invitation Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Farm:</span>
                      <span className="font-medium">Farm Team</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-medium capitalize">Team Member</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invited by:</span>
                      <span className="font-medium">Farm Manager</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  {user ? (
                    <Button
                      onClick={handleAcceptInvite}
                      disabled={isAccepting}
                      className="w-full"
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        'Accept Invitation'
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 text-center">
                        You need to create an account or login to accept this invitation
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setShowSignup(true)}
                          variant="outline"
                          className="flex-1"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create Account
                        </Button>
                        <Button
                          onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)}
                          className="flex-1"
                        >
                          Login
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => navigate('/')}
                className="text-sm text-gray-600"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Having trouble? Contact the person who invited you for assistance.</p>
        </div>
      </div>
    </div>
  );
}
