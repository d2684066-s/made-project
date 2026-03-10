import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth.context';
import { Eye, EyeOff, Loader2, UserPlus, Bus, Truck } from 'lucide-react';

// Demo accounts for testing
const DEMO_ACCOUNTS = [
    { role: 'student', name: 'Student Demo', phone: '9348069614', password: 'ds1', driver_type: null },
    { role: 'driver', name: 'Bus Driver Demo', phone: '9348069615', password: 'ds1', driver_type: 'bus' },
    { role: 'driver', name: 'Ambulance Driver Demo 1', phone: '9348069616', password: 'ds1', driver_type: 'ambulance' },
    { role: 'driver', name: 'Ambulance Driver Demo 2', phone: '9348069617', password: 'ds1', driver_type: 'ambulance' },
];

const Signup = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();

    const [role, setRole] = useState('student'); // 'student' | 'driver'
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        registration_id: '',
        phone: '',
        password: '',
        confirmPassword: '',
        driver_type: 'bus' // only for driver
    });

    const handleChange = (e) => {
        setError('');
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleUseDemoAccount = (account) => {
        setRole(account.role);
        setFormData({
            name: account.name,
            registration_id: `REG_${account.phone}`,
            phone: account.phone,
            password: account.password,
            confirmPassword: account.password,
            driver_type: account.driver_type || 'bus'
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name || !formData.phone || !formData.password) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 3) {
            setError('Password must be at least 3 characters long');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                registration_id: role === 'student' ? formData.registration_id : `DRV_${formData.phone}`,
                phone: formData.phone,
                password: formData.password,
                role: role,
            };

            if (role === 'driver') {
                payload.driver_type = formData.driver_type;
            }

            await signup(payload);

            // Redirect based on role
            if (role === 'student') navigate('/student/dashboard');
            else navigate('/driver/dashboard');
        } catch (error) {
            setError(error.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-[100dvh] flex flex-col items-center justify-center p-4 transition-colors duration-500 overflow-y-auto py-10 ${role === 'driver' ? 'bg-[#121214] text-white' : 'bg-[#F8F9FE] text-gray-900'}`}>
            <div className={`w-full max-w-md p-8 rounded-3xl shadow-xl transition-all duration-500 ${role === 'driver' ? 'bg-[#1C1C1E] border border-[#2A2A2D]' : 'bg-white border border-gray-100'}`}>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${role === 'driver' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        <UserPlus size={32} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
                    <p className={`mt-2 text-sm ${role === 'driver' ? 'text-gray-400' : 'text-gray-500'}`}>Join us as a {role}</p>
                </div>

                {/* Role Toggle */}
                <div className={`flex p-1 rounded-xl mb-6 ${role === 'driver' ? 'bg-[#2A2A2D]' : 'bg-gray-100'}`}>
                    <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'student' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Student
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('driver')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'driver' ? 'bg-[#1C1C1E] text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        Driver
                    </button>
                </div>

                {/* Demo Accounts Section */}
                <div className={`mb-6 p-3 rounded-lg ${role === 'driver' ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'}`}>
                    <p className={`text-xs font-medium ${role === 'driver' ? 'text-blue-300' : 'text-blue-700'} mb-2`}>📋 Test Accounts:</p>
                    <div className="grid grid-cols-2 gap-1">
                        {DEMO_ACCOUNTS.filter(acc => acc.role === role).map((acc, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleUseDemoAccount(acc)}
                                className={`p-2 text-xs rounded transition-all ${role === 'driver' ? 'bg-blue-800/40 hover:bg-blue-800/60 text-blue-300' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}
                            >
                                <div className="font-medium">{acc.phone}</div>
                                <div className="opacity-70">{acc.password}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className={`text-sm font-medium ${role === 'driver' ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                            className={`w-full h-11 px-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm ${role === 'driver' ? 'bg-[#121214] border border-[#3A3A3D] text-white placeholder-gray-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white'
                                }`}
                        />
                    </div>

                    {role === 'student' && (
                        <div className="space-y-1.5">
                            <label className={`text-sm font-medium ${role === 'driver' ? 'text-gray-300' : 'text-gray-700'}`}>Registration ID</label>
                            <input
                                type="text"
                                name="registration_id"
                                value={formData.registration_id}
                                onChange={handleChange}
                                placeholder="Enter your college registration ID"
                                required
                                className={`w-full h-11 px-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm ${role === 'driver' ? 'bg-[#121214] border border-[#3A3A3D] text-white placeholder-gray-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white'
                                    }`}
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className={`text-sm font-medium ${role === 'driver' ? 'text-gray-300' : 'text-gray-700'}`}>Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter your phone number"
                            required
                            className={`w-full h-11 px-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm ${role === 'driver' ? 'bg-[#121214] border border-[#3A3A3D] text-white placeholder-gray-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white'
                                }`}
                        />
                    </div>

                    {role === 'driver' && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-300">Driver Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, driver_type: 'bus' })}
                                    className={`py-2 rounded-xl border border-[#3A3A3D] transition-all flex items-center justify-center gap-2 text-sm ${formData.driver_type === 'bus' ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : 'text-gray-400 hover:bg-[#2A2A2D]'
                                        }`}
                                >
                                    <Bus size={16} /> Bus
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, driver_type: 'ambulance' })}
                                    className={`py-2 rounded-xl border border-[#3A3A3D] transition-all flex items-center justify-center gap-2 text-sm ${formData.driver_type === 'ambulance' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'text-gray-400 hover:bg-[#2A2A2D]'
                                        }`}
                                >
                                    <Truck size={16} /> Ambulance
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className={`text-sm font-medium ${role === 'driver' ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                required
                                className={`w-full h-11 pl-4 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm ${role === 'driver' ? 'bg-[#121214] border border-[#3A3A3D] text-white placeholder-gray-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white'
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-4 top-1/2 -translate-y-1/2 ${role === 'driver' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-sm font-medium ${role === 'driver' ? 'text-gray-300' : 'text-gray-700'}`}>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Retype password"
                            required
                            className={`w-full h-11 px-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm ${role === 'driver' ? 'bg-[#121214] border border-[#3A3A3D] text-white placeholder-gray-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white'
                                }`}
                        />
                    </div>

                    {error && (
                        <div className={`p-3 rounded-lg text-sm ${role === 'driver' ? 'bg-red-900/20 text-red-300 border border-red-800/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 mt-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white font-medium rounded-xl flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                        Create Account
                    </button>
                </form>

                <div className={`mt-6 text-center text-sm ${role === 'driver' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className={`font-medium hover:underline ${role === 'driver' ? 'text-blue-400' : 'text-blue-600'}`}
                    >
                        Sign in
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Signup;
