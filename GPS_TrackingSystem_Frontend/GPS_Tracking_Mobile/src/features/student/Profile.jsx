import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth.context';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        ...form,
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        dob: user.dob || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        dob: form.dob,
      };
      if (form.password) payload.password = form.password;
      const response = await axios.patch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/auth/me/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile updated');
      // reload user info by refreshing
      window.location.reload();
    } catch (err) {
      console.error('Profile update error', err);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern p-4 flex items-center justify-center overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent dark:scrollbar-thumb-slate-700">
      <div className="w-full max-w-md glass rounded-xl p-8">
        <h1 className="font-heading font-bold text-2xl mb-4">My Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-sky-500 hover:bg-sky-600 text-lg mt-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Update
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
