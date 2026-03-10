import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth.context';
import { publicApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Help = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter a description of your issue');
      return;
    }
    setLoading(true);
    try {
      const role = user?.role || 'public';
      await publicApi.submitIssue(
        { message, screenshot_url: screenshot, user_role: role },
        token
      );
      toast.success('Issue submitted successfully');
      navigate(-1);
    } catch (err) {
      console.error('Help submit error:', err);
      toast.error('Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern p-4 flex items-center justify-center">
      <div className="w-full max-w-md glass rounded-xl p-8">
        <h1 className="font-heading font-bold text-2xl mb-4">Report an Issue</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              placeholder="Describe the problem you encountered..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Screenshot URL <Link2 className="inline-block" size={14} /></Label>
            <Input
              placeholder="https://..."
              value={screenshot}
              onChange={(e) => setScreenshot(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-sky-500 hover:bg-sky-600 text-lg mt-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Help;
