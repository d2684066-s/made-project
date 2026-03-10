import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../core/auth.context';
import { LayoutDashboard, PlayCircle, MapPin, Bell, HelpCircle, LogOut, User, Home, Truck, Navigation, X } from 'lucide-react';
import ThemeToggle from '../shared/components/ThemeToggle';
import { useState, useRef, useEffect } from 'react';
import { driverApi } from '../lib/api';
import { toast } from 'sonner';

export const DriverLayout = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [availableVehicles, setAvailableVehicles] = useState([]);
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

    const navItems = [
        { name: 'Dashboard', path: '/driver/dashboard', icon: LayoutDashboard, mobileIcon: Home },
        { name: 'Assignment', path: '/driver/vehicle-assignment', icon: MapPin, mobileIcon: Truck },
        // Only show Active and Requests for ambulance drivers
        ...(user?.driver_type === 'ambulance' ? [
            { name: 'Active', path: '/driver/active-trip', icon: PlayCircle, mobileIcon: Navigation },
            { name: 'Requests', path: '/driver/pending-requests', icon: Bell, mobileIcon: Bell }
        ] : [])
    ];

    const handleVehicleIconClick = () => {
        setShowVehicleModal(true);
        fetchAvailableVehicles();
    };

    const fetchAvailableVehicles = async () => {
        try {
            const vehicleType = user?.driver_type === 'bus' ? 'bus' : 'ambulance';
            const response = await driverApi.getAvailableVehicles(vehicleType, token);
            const vehicles = response.data?.vehicles || [];
            setAvailableVehicles(vehicles);
        } catch (error) {
            console.error('Failed to fetch available vehicles:', error);
            toast.error('Failed to load available vehicles');
        }
    };

    const handleVehicleSelect = async (vehicleId) => {
        try {
            // If driver already has a vehicle, release it first
            // This would need to be handled by checking current assignment
            await driverApi.assignVehicle(vehicleId, token);
            toast.success(`${user?.driver_type === 'bus' ? 'Bus' : 'Ambulance'} assigned successfully!`);
            setShowVehicleModal(false);
            // Refresh the page or update state to show new vehicle
            window.location.reload();
        } catch (error) {
            console.error('Failed to assign vehicle:', error);
            toast.error('Failed to assign vehicle');
        }
    };

    return (
        <div className="bg-[#f6f7f8] dark:bg-[#101922] min-h-screen text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-100 flex flex-col transition-colors duration-300">

            {/* Sidebar for Desktop / Hidden on Mobile */}
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col h-screen sticky top-0 shadow-sm">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">Driver Portal</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">Fleet Management</p>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 mt-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${isActive
                                        ? 'bg-[#137fec] text-white shadow-md shadow-[#137fec]/20'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#137fec]'
                                    }`
                                }
                            >
                                <Icon size={18} />
                                {item.name}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <ThemeToggle />
                        <button
                            onClick={() => navigate('/driver/help')}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Report Issue"
                        >
                            <HelpCircle size={20} className="text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="flex flex-col">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{user?.name || 'Driver'}</h4>
                            <span className="text-[10px] flex items-center gap-1 text-green-500 font-bold uppercase tracking-wider">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Online
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                            // Prevent back navigation to dashboard
                            window.history.pushState(null, null, window.location.href);
                            window.onpopstate = function () {
                                window.history.go(1);
                            };
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 text-slate-500 transition-colors text-sm font-bold rounded-xl"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="md:hidden px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-[#101922]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Driver Portal</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Fleet Management</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="h-10 w-10 bg-gradient-to-tr from-[#137fec] to-blue-400 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                            >
                                {user?.name?.charAt(0) || 'D'}
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 mb-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name || 'Driver'}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.phone || user?.email || 'driver@gce.com'}</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/driver/help')}
                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/10 flex items-center gap-2 transition-colors"
                                    >
                                        <HelpCircle size={16} />
                                        <span>Report Issue</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            logout();
                                            navigate('/login');
                                            // Prevent back navigation to dashboard
                                            window.history.pushState(null, null, window.location.href);
                                            window.onpopstate = function () {
                                                window.history.go(1);
                                            };
                                        }}
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

                <main className="p-4 md:p-8 flex-1 max-w-7xl mx-auto w-full pb-20 md:pb-8 overflow-y-auto h-[calc(100vh-180px)] md:h-auto">
                    <Outlet />
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg z-50">
                    <div className="flex justify-around items-center py-2 px-4">
                        {navItems.map((item) => {
                            const Icon = item.mobileIcon;
                            // Special handling for Assignment (vehicle) item
                            if (item.name === 'Assignment') {
                                return (
                                    <button
                                        key={item.name}
                                        onClick={handleVehicleIconClick}
                                        className="flex flex-col items-center justify-center p-2 rounded-lg transition-all text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-[#137fec] hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        <Icon size={20} className="mb-1" />
                                        <span className="text-[10px]">{item.name === 'Dashboard' ? 'Home' : item.name === 'Assignment' ? 'Vehicle' : item.name === 'Active' ? 'Trip' : item.name}</span>
                                    </button>
                                );
                            }
                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex flex-col items-center justify-center p-2 rounded-lg transition-all text-xs font-medium ${
                                            isActive
                                                ? 'text-[#137fec] bg-[#137fec]/10'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-[#137fec] hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`
                                    }
                                >
                                    <Icon size={20} className="mb-1" />
                                    <span className="text-[10px]">{item.name === 'Dashboard' ? 'Home' : item.name === 'Assignment' ? 'Vehicle' : item.name === 'Active' ? 'Trip' : item.name}</span>
                                </NavLink>
                            );
                        })}
                        <NavLink
                            to="/driver/help"
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center p-2 rounded-lg transition-all text-xs font-medium ${
                                    isActive
                                        ? 'text-[#137fec] bg-[#137fec]/10'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-[#137fec] hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            <User size={20} className="mb-1" />
                            <span className="text-[10px]">Profile</span>
                        </NavLink>
                    </div>
                </nav>

                {/* Vehicle Selection Modal */}
                {showVehicleModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        Select {user?.driver_type === 'bus' ? 'Bus' : 'Ambulance'}
                                    </h3>
                                    <button
                                        onClick={() => setShowVehicleModal(false)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 max-h-96 overflow-y-auto">
                                {availableVehicles.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Truck size={48} className="mx-auto text-slate-300 mb-4" />
                                        <p className="text-slate-500 dark:text-slate-400">
                                            No {user?.driver_type === 'bus' ? 'buses' : 'ambulances'} available
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {availableVehicles.map((vehicle) => (
                                            <button
                                                key={vehicle.id}
                                                onClick={() => handleVehicleSelect(vehicle.id)}
                                                className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-[#137fec] hover:bg-[#137fec]/5 transition-all text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Truck size={24} className="text-[#137fec]" />
                                                    <div>
                                                        <p className="font-semibold text-slate-900 dark:text-white">
                                                            {vehicle.vehicle_number}
                                                        </p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            {vehicle.model} • {vehicle.capacity} seats
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
