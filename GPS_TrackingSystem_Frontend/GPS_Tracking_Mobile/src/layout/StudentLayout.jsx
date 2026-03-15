import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../core/auth.context';
import { Home, Map, Calendar, Menu, LogOut, AlertCircle, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ThemeToggle from '../shared/components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';
import { useBooking } from '../context/BookingContext';

export const StudentLayout = () => {
    const { user, logout } = useAuth();
    const { activeBooking } = useBooking();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Navigation items - reordered with ambulance in middle
    const navItems = [
        { name: 'Home', path: '/student/dashboard', icon: Home },
        { name: 'Track', path: '/student/track', icon: Map },
        { name: 'Medical', path: '/student/book-ambulance', icon: AlertCircle }, // Medical Dispatch (Ambulance)
        { name: 'Schedule', path: '/student/schedule', icon: Calendar },
        { name: 'Alerts', path: '/student/notifications', icon: Bell },
    ];

    return (
        <div className="bg-[#f6f7f8] dark:bg-[#101922] min-h-screen pb-20 md:pb-0 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-100 transition-colors duration-300">
            {/* Top Header - PROFILE ICON REMOVED */}
            <header className="px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-[#101922]/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Hello, {user?.name || 'Student'}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ready for your ride?</p>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <NotificationBell />
                    <div className="relative" ref={menuRef}>
                        {/* Menu button - replaced profile avatar */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Menu"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 mb-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name || 'Student'}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.phone || user?.email || 'student@gce.com'}</p>
                                </div>
                                <button
                                    onClick={() => { navigate("/student/profile"); setIsMenuOpen(false); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/10 flex items-center gap-2 transition-colors"
                                >
                                    <span>👤</span>
                                    <span>My Profile</span>
                                </button>
                                <button
                                    onClick={() => navigate("/student/help")}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/10 flex items-center gap-2 transition-colors"
                                >
                                    <span>❓</span>
                                    <span>Help & Support</span>
                                </button>

                                <button
                                    onClick={logout}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="p-4 md:p-6 max-w-4xl mx-auto overflow-y-auto h-[calc(100vh-180px)] md:h-auto">
                <Outlet />
            </main>

            {/* Bottom Navigation for Mobile - NEW ORDER */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center md:hidden z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
                                    isActive
                                        ? 'text-[#137fec] scale-110'
                                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`relative ${isActive ? 'animate-bounce' : ''}`}>
                                        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                        {item.name === 'Medical' && isActive && (
                                            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-bold tracking-tight transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                                        {item.name === 'Medical' ? '🚑' : item.name}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
};
