import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Users,
  Mail,
  Send,
  Trash2,
  CheckCircle,
  AlertCircle,
  UserPlus,
  RefreshCw,
} from 'lucide-react';

interface FarmInvite {
  id: string;
  email: string;
  role: string;
  message?: string;
  status: string;
  created_at: string;
  expires_at: string;
  inviter_name: string;
  farm_name: string;
}

interface Farm {
  id: string;
  farm_name: string;
  role: string;
}

export default function FarmInvites() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [invites, setInvites] = useState<FarmInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'worker',
    message: '',
  });

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm) {
      loadInvites();
    }
  }, [selectedFarm]);

  const loadFarms = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/farms', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFarms(data);
        if (data.length > 0) {
          setSelectedFarm(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load farms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvites = async () => {
    if (!selectedFarm) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/auth/invites?farm_id=${selectedFarm}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvites(data);
      }
    } catch (error) {
      console.error('Failed to load invites:', error);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedFarm || !inviteForm.email) {
      setMessage('Please select a farm and enter an email address');
      return;
    }

    setIsSending(true);
    setMessage('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/auth/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          farm_id: selectedFarm,
          email: inviteForm.email,
          role: inviteForm.role,
          message: inviteForm.message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Invitation sent successfully!');
        setInviteForm({ email: '', role: 'worker', message: '' });
        loadInvites();
      } else {
        setMessage(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/auth/invites?id=${inviteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage('Invitation revoked successfully');
        loadInvites();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to revoke invitation');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      worker: 'bg-green-100 text-green-800',
      member: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Farm Invitations</h2>
        <p className="text-gray-600">Manage invitations for your farm team members</p>
      </div>

      {message && (
        <Alert
          className={
            message.includes('success')
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }
        >
          {message.includes('success') ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={message.includes('success') ? 'text-green-800' : 'text-red-800'}
          >
            {message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send New Invite */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Send New Invitation
            </CardTitle>
            <CardDescription>Invite someone to join your farm team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farm">Farm</Label>
              <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map(farm => (
                    <SelectItem key={farm.id} value={farm.id}>
                      {farm.farm_name} ({farm.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteForm.email}
                onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={role => setInviteForm({ ...inviteForm, role })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worker">Worker</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={inviteForm.message}
                onChange={e => setInviteForm({ ...inviteForm, message: e.target.value })}
                placeholder="Add a personal message to the invitation..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleSendInvite}
              disabled={isSending || !selectedFarm || !inviteForm.email}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Invites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Invitations
            </CardTitle>
            <CardDescription>View and manage sent invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>No invitations sent yet</p>
                </div>
              ) : (
                invites.map(invite => (
                  <div key={invite.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{invite.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(invite.status)}
                        {invite.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeInvite(invite.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {getRoleBadge(invite.role)}
                      <span>•</span>
                      <span>Invited by {invite.inviter_name}</span>
                    </div>

                    {invite.message && (
                      <p className="text-sm text-gray-600 italic">{invite.message}</p>
                    )}

                    <div className="text-xs text-gray-500">
                      Sent {new Date(invite.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {invites.length > 0 && (
              <Button variant="outline" size="sm" onClick={loadInvites} className="w-full mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
