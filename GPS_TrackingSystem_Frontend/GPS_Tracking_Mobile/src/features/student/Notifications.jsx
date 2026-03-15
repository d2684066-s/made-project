import { useState, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../core/auth.context';
import { Bell, CheckCircle2, Clock, AlertCircle, Phone, MapPin, User, X, Loader2, RefreshCw } from 'lucide-react';
import { publicApi } from '../../lib/api';
import { toast } from 'sonner';

const StudentNotifications = () => {
    const { notifications, activeBooking, fetchNotifications } = useBooking();
    const { user } = useAuth();
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch notifications on component mount or when user changes
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                setLoading(true);
                // Fetch from backend using student's phone
                if (user?.phone) {
                    await fetchNotifications(user.phone);
                }
            } catch (error) {
                console.error('Failed to load notifications:', error);
                toast.error('Could not load notifications');
            } finally {
                setLoading(false);
            }
        };

        loadNotifications();

        // Poll for new notifications every 5 seconds
        const interval = setInterval(loadNotifications, 5000);
        return () => clearInterval(interval);
    }, [user?.phone, fetchNotifications]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            if (user?.phone) {
                await fetchNotifications(user.phone);
                toast.success('Notifications updated');
            }
        } catch (error) {
            console.error('Failed to refresh notifications:', error);
            toast.error('Failed to refresh notifications');
        } finally {
            setRefreshing(false);
        }
    };

    // Get notifications for current user's bookings
    const userNotifications = notifications
        .filter(n => n && !n.deleted)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'accepted':
                return <CheckCircle2 size={24} className="text-green-500" />;
            case 'rejected':
                return <AlertCircle size={24} className="text-red-500" />;
            case 'eta':
                return <Clock size={24} className="text-blue-500" />;
            case 'arrived':
                return <MapPin size={24} className="text-purple-500" />;
            case 'in_progress':
                return <Clock size={24} className="text-blue-500" />;
            case 'completed':
                return <CheckCircle2 size={24} className="text-green-500" />;
            default:
                return <Bell size={24} className="text-slate-500" />;
        }
    };

    const getNotificationTitle = (type) => {
        switch (type) {
            case 'accepted':
                return 'Driver Assigned';
            case 'rejected':
                return 'Request Rejected';
            case 'eta':
                return 'ETA Update';
            case 'arrived':
                return 'Driver Arrived';
            case 'in_progress':
                return 'On The Way';
            case 'completed':
                return 'Booking Completed';
            default:
                return 'Notification';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'accepted':
                return 'bg-green-50 dark:bg-green-500/10 border-l-4 border-green-500';
            case 'rejected':
                return 'bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500';
            case 'eta':
                return 'bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-500';
            case 'arrived':
                return 'bg-purple-50 dark:bg-purple-500/10 border-l-4 border-purple-500';
            case 'in_progress':
                return 'bg-orange-50 dark:bg-orange-500/10 border-l-4 border-orange-500';
            case 'completed':
                return 'bg-green-50 dark:bg-green-500/10 border-l-4 border-green-500';
            default:
                return 'bg-slate-50 dark:bg-slate-800 border-l-4 border-slate-300 dark:border-slate-600';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-[#137fec] mb-4" size={40} />
                <p className="text-slate-500 dark:text-slate-400">Loading notifications...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent dark:scrollbar-thumb-slate-700">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/20 dark:bg-blue-500/30 rounded-lg">
                            <Bell size={28} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notifications</h1>
                            <p className="text-slate-600 dark:text-slate-400">Track your ambulance booking updates</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={`p-2 rounded-xl transition-all ${refreshing ? 'animate-spin' : 'hover:bg-white dark:hover:bg-slate-800'}`}
                        title="Refresh"
                    >
                        <RefreshCw size={18} className="text-[#137fec]" />
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="max-w-2xl mx-auto">
                {userNotifications.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
                        <div className="mb-4">
                            <Bell size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Notifications Yet</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Your ambulance booking notifications will appear here as you make requests.
                        </p>
                        {!activeBooking && (
                            <p className="text-sm text-slate-500 dark:text-slate-500">
                                Book an ambulance to start receiving notifications
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {userNotifications.map((notif, index) => (
                            <div
                                key={notif.id || index}
                                className={`${getNotificationColor(notif.notification_type)} rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer`}
                                onClick={() => setSelectedNotification(selectedNotification === index ? null : index)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notif.notification_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white">
                                            {getNotificationTitle(notif.notification_type)}
                                        </h3>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                                            {notif.message}
                                        </p>
                                        {notif.driver_name && (
                                            <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <User size={16} />
                                                    <span>{notif.driver_name}</span>
                                                </div>
                                                {notif.driver_phone && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.href = `tel:${notif.driver_phone}`;
                                                        }}
                                                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                                    >
                                                        <Phone size={16} />
                                                        <span>{notif.driver_phone}</span>
                                                    </button>
                                                )}
                                                {notif.vehicle_number && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span>🚑 {notif.vehicle_number}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                            {new Date(notif.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Active Booking Summary */}
            {activeBooking && (
                <div className="max-w-2xl mx-auto mt-8 bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-blue-500/50 dark:border-blue-400/50 shadow-lg">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Active Booking</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Status</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                                {activeBooking.status}
                            </p>
                        </div>
                        {activeBooking.eta && (
                            <div>
                                <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">ETA</p>
                                <p className="text-lg font-bold text-[#137fec]">
                                    {typeof activeBooking.eta === 'object' ? activeBooking.eta.minutes : activeBooking.eta} min away
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentNotifications;
