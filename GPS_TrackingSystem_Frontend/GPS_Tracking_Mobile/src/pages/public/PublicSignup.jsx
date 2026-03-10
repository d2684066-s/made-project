import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { MapPin, Loader2, ArrowLeft } from 'lucide-react';

const PublicSignup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    registration_id: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signup({
        name: formData.name,
        registration_id: formData.registration_id,
        phone: formData.phone,
        password: formData.password,
        role: 'student'
      });
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center">
            <MapPin className="h-12 w-12 text-sky-500 mx-auto mb-2" />
            <h1 className="font-heading font-bold text-2xl text-foreground">Student Registration</h1>
          </div>
          <div className="w-10" />
        </div>

        <div className="glass rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Registration ID</Label>
              <Input 
                placeholder="e.g., 21CS001"
                value={formData.registration_id}
                onChange={(e) => setFormData({...formData, registration_id: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input 
                type="password"
                placeholder="Create password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Retype Password</Label>
              <Input 
                type="password"
                placeholder="Retype password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-sky-500 hover:bg-sky-600 text-lg mt-6"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Register
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">Already have an account?</p>
            <Button variant="link" onClick={() => navigate('/login')} className="text-sky-500">
              Login here
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSignup;
