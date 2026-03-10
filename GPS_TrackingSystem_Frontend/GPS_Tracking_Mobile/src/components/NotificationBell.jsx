import { useState, useEffect } from 'react';
import { Bell, X, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useBooking } from '../context/BookingContext';

const NotificationBell = () => {
    const { activeBooking, notifications, clearNotification } = useBooking();
    const [isOpen, setIsOpen] = useState(false);

    // Use notifications from context instead of generating them
    const bookingNotifications = notifications.filter(n => n.bookingId === activeBooking?.id);

    // Auto-delete completed notifications
    useEffect(() => {
        bookingNotifications.forEach((notif) => {
            if (notif.type === 'accepted' && !notif.deleted) {
                // Auto-delete accepted notifications after 5 seconds
                setTimeout(() => {
                    if (activeBooking?.id) {
                        clearNotification(activeBooking.id, notif);
                    }
                }, 5000);
            }
        });
    }, [bookingNotifications, activeBooking?.id, clearNotification]);

    const removeNotification = (notification) => {
        if (activeBooking?.id) {
            clearNotification(activeBooking.id, notification);
        }
    };

    const hasNotifications = bookingNotifications.length > 0;

    return (
        <div className="relative">
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Notifications"
            >
                <Bell size={20} />
                {hasNotifications && (
                    <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                )}
            </button>

            {/* Notifications Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-14 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in slide-in-from-top-2 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900">
                        <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {bookingNotifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {bookingNotifications.map((notif, index) => {
                                const Icon = notif.type === 'accepted' ? CheckCircle2 : Clock;
                                const bgColor = notif.type === 'accepted' 
                                    ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30'
                                    : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30';
                                
                                const textColor = notif.type === 'accepted'
                                    ? 'text-green-900 dark:text-green-200'
                                    : 'text-blue-900 dark:text-blue-200';
                                
                                const iconColor = notif.type === 'accepted'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-blue-600 dark:text-blue-400';

                                return (
                                    <div
                                        key={index}
                                        className={`p-4 border-l-4 ${bgColor}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Icon size={20} className={iconColor} />
                                            <div className="flex-1">
                                                <p className={`font-bold text-sm ${textColor}`}>
                                                    {notif.type === 'accepted' ? 'Driver Assigned' : 'Ambulance Requested'}
                                                </p>
                                                <p className={`text-xs mt-1 ${textColor}`}>{notif.message}</p>
                                            </div>
                                            <button
                                                onClick={() => removeNotification(notif)}
                                                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                                            >
                                                <X size={14} className={textColor} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
