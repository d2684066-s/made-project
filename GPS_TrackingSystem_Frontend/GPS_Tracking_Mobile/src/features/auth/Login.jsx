import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth.context';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    // Default to student as requested by the specific design, but we can still keep the state to support driver login if needed later
    const [role, setRole] = useState('student');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ phone, password }, role);

            // Redirect based on role
            if (role === 'student') {
                navigate('/student/dashboard');
            } else if (role === 'driver') {
                navigate('/driver/dashboard');
            }
        } catch (error) {
            const errorMessage = error.message || 'Login failed. Please try again.';
            setError(errorMessage);
            toast.error('Login Failed', {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative w-full bg-[#f6f7f8] dark:bg-[#101922] font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300 selection:bg-blue-100 min-h-screen overflow-y-auto">
            {/* Header */}
            <div className="flex items-center bg-[#f6f7f8] dark:bg-[#101922] p-4 pb-2 justify-between sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="text-slate-900 dark:text-slate-100 flex h-12 w-12 shrink-0 items-center justify-center cursor-pointer transition-transform hover:-translate-x-1 active:scale-95"
                    title="Go back"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
                    {role === 'student' ? 'Student' : 'Driver'} Login
                </h2>
                <div className="w-12"></div>
            </div>

            {/* Role Switch */}
            <div className="px-4 py-2 flex justify-center mt-2">
                <div className="bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl flex gap-1 w-full max-w-[480px]">
                    <button
                        onClick={() => setRole('student')}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${role === 'student'
                            ? 'bg-white dark:bg-[#137fec] text-[#137fec] dark:text-white shadow-sm scale-[1.02]'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        Student
                    </button>
                    <button
                        onClick={() => setRole('driver')}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${role === 'driver'
                            ? 'bg-white dark:bg-[#137fec] text-[#137fec] dark:text-white shadow-sm scale-[1.02]'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        Driver
                    </button>
                </div>
            </div>

            {/* Hero Illustration / Image */}
            <div className="px-4 py-3">
                <div
                    className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-blue-500/10 rounded-lg min-h-[220px] shadow-sm relative group"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDSByXm8uS0ZOic1OIUaKLg_1clC3E-3sGi38vA_2fmIxpf5i88m4SkgypMOEkYZ2nw80eIVLdf2jyQj_QYmQAxNBnu2xkq-OGzic5lHjEYW_pbgu45bAS2H3go6Nlh6oVhEXVOWHA6NSUabQxgA1sCsR53UaSqmuTR_gT4M0ZIHMHQD2vVWQ_I0g9JXPlNfLa5jArXts5210307HKymXsjCOCpOMHW-pFHgTRz8x-Aj1C76lvOtr3DV2Qa794yfb7rBDKmylaLSMo")' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101922]/40 to-transparent"></div>
                </div>
            </div>

            {/* Welcome Text */}
            <div className="px-4 py-6 text-center">
                <h2 className="text-slate-900 dark:text-slate-100 tracking-tight text-[28px] font-bold leading-tight pb-2">Welcome Back</h2>
                <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal px-4">Login to track your bus or book emergency ambulance services</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="px-4 py-2 max-w-[480px] mx-auto w-full">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4 px-4 py-2 max-w-[480px] mx-auto w-full">
                <label className="flex flex-col w-full">
                    <p className="text-slate-900 dark:text-slate-100 text-sm font-semibold leading-normal pb-2">Phone or Email</p>
                    <div className="relative flex items-center group">
                        <Mail size={20} className="absolute left-4 text-slate-400 group-focus-within:text-[#137fec] transition-colors" />
                        <input
                            className="flex w-full rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 h-14 placeholder:text-slate-400 pl-12 pr-4 text-base font-normal transition-all duration-300"
                            placeholder="Enter your phone or email"
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>
                </label>

                <label className="flex flex-col w-full">
                    <p className="text-slate-900 dark:text-slate-100 text-sm font-semibold leading-normal pb-2">Password</p>
                    <div className="relative flex items-center group">
                        <Lock size={20} className="absolute left-4 text-slate-400 group-focus-within:text-[#137fec] transition-colors" />
                        <input
                            className="flex w-full rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 h-14 placeholder:text-slate-400 pl-12 pr-12 text-base font-normal transition-all duration-300"
                            placeholder="••••••••"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </label>

                {/* Forgot Password */}
                <div className="flex justify-end pt-1">
                    <button type="button" className="text-[#137fec] text-sm font-semibold hover:underline transition-all">Forgot password?</button>
                </div>

                {/* Login Button */}
                <div className="pt-4 pb-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold h-14 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#137fec]/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : (
                            <>
                                <span>Login to Account</span>
                                <LogIn size={20} />
                            </>
                        )}
                    </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">or continue with</span>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                </div>

                {/* Social Logins */}
                <div className="flex gap-4 py-4">
                    <button type="button" className="flex-1 h-14 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm active:scale-95">
                        <img alt="Google Icon" className="w-6 h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJJnSizzJrK04T7Tfe0GggfAruS6o-MfBWcmXVa1O8rFiWeMZ6HLSu9VX4bLKhxwxPTQ68qjlcJJ3jPknsgWXrYWoPiAKZKvrDjteFSFENIhatH1OHScE2VhH2DnFyGIjLg3jSNt3_5kK_AkdMmEdFG1Ozh14ynBoexx-qZZ1M9ALf0us2plDkKGC0RNhsW1OFqLn4beyJdwfxnjX7vqpfrXN9usJla_-s__LASihPv_Rt6cEOEtE_KDqZchPNI1NyWRkPTPiXjuM" />
                    </button>
                    <button type="button" className="flex-1 h-14 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm active:scale-95">
                        <img alt="Apple Icon" className="w-6 h-6 dark:invert" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbWjrtkZSCqz7OLxgMVtIiBug64OL4OLpUEmqmcdm-xuFw_hWGlxSK7RVUrifMFn4zXRjRAVYRPd0CbbFP_Sj7VM6fMfJbrUfDz_MhTxi-vujzo3meyysTiGfMpwlYyJHEFRwTetrdoE2_yZFpFjLlLmUQHv1dGDe381-LJSrtGbhOF0ox-WLanCs9OWuZ-YupVTk0pO5yhXTuZqls7XMgRN-CpJg7BUnTLf_YJYVhripi1cUATdBy-7hzcJSaebpCTC91WsZ03lc" />
                    </button>
                </div>
            </form>

            {/* Footer Note */}
            <div className="mt-8 pb-10 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Don't have an account?
                    <button type="button" onClick={() => navigate('/signup')} className="text-[#137fec] font-bold ml-1 hover:underline transition-all">Sign Up</button>
                </p>
            </div>
        </div>
    );
};

export default Login;

