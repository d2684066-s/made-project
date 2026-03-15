import { useState, useEffect } from 'react';
import { useAuth } from '../../core/auth.context';
import { publicApi } from '../../lib/api';
import { Loader2, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getBookingStatusStyle, formatDate, formatTime } from '../../services/locationService';
import { ChevronRight } from 'lucide-react';

const Schedule = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000); // Poll every 10 seconds for updates
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await publicApi.getMyBookings(token);
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings', err);
      toast.error('Could not load schedule');
    } finally {
      setLoading(false);
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#137fec] mb-4" size={40} />
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse text-sm tracking-wide">Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent dark:scrollbar-thumb-slate-700 min-h-screen px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Medical Bookings</h2>
        <button
          onClick={fetchBookings}
          className="text-xs font-bold text-[#137fec] hover:text-blue-600 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Status Legend */}
      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 mb-6">
        <p className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide mb-3">Booking Status Guide</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-blue-800 dark:text-blue-100">Coming Soon</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-blue-800 dark:text-blue-100">On the Way</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-blue-800 dark:text-blue-100">Completed</span>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Clock className="mx-auto mb-3 text-slate-300 dark:text-slate-700" size={40} />
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">No bookings yet</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Your medical bookings will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking, idx) => {
            const statusStyle = getBookingStatusStyle(booking.status);
            const createdDate = new Date(booking.created_at);

            return (
              <div
                key={booking.id || idx}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-[#137fec]/50 dark:hover:border-[#137fec]/50 transition-all hover:shadow-lg hover:shadow-blue-500/5 group"
              >
                {/* Main Row */}
                <div className="flex items-center justify-between">
                  {/* Status Indicator + Info */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Status Dot */}
                    <div className="relative">
                      <div className={`h-4 w-4 rounded-full ${statusStyle.dotColor} shadow-lg`}></div>
                      {booking.status === 'pending' && (
                        <div className={`absolute inset-0 h-4 w-4 rounded-full ${statusStyle.dotColor} opacity-50 animate-ping`}></div>
                      )}
                    </div>

                    {/* Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {booking.place || 'Medical Ambulance'}
                        </p>
                        {booking.status === 'pending' && (
                          <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded font-bold">
                            Waiting
                          </span>
                        )}
                        {booking.status === 'accepted' && (
                          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 rounded font-bold">
                            Accepted
                          </span>
                        )}
                      </div>

                      {/* Booking ID & Details */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        ID: {booking.id?.toString().slice(0, 12) || 'N/A'}...
                      </p>

                      {/* Date & Time */}
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(booking.created_at)} • {formatTime(booking.created_at)}
                      </p>

                      {/* Driver Info - if accepted */}
                      {booking.status !== 'pending' && booking.driver_name && (
                        <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
                          <p className="font-bold text-slate-900 dark:text-white">🚑 Driver: {booking.driver_name}</p>
                          {booking.driver_phone && (
                            <p className="text-slate-600 dark:text-slate-400 font-mono">
                              📞 {booking.driver_phone}
                            </p>
                          )}
                          {booking.eta && (
                            <p className="text-blue-600 dark:text-blue-400 font-bold mt-1">
                              ⏱️ ETA: {booking.eta} minutes
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3 ml-4">
                    <div className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${statusStyle.bgLight} ${statusStyle.textColor}`}>
                      {statusStyle.label}
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-slate-300 dark:text-slate-600 group-hover:text-[#137fec] group-hover:translate-x-1 transition-all"
                    />
                  </div>
                </div>

                {/* Status Message */}
                {booking.status === 'pending' && (
                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      ⏳ Waiting for driver to accept your booking...
                    </p>
                  </div>
                )}

                {booking.status === 'accepted' && (
                  <div className="mt-3 p-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg">
                    <p className="text-xs text-green-800 dark:text-green-200 font-bold">
                      ✓ Driver accepted! Ambulance arriving soon. Please wait patiently.
                    </p>
                  </div>
                )}

                {booking.status === 'in_progress' && (
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      🚑 Ambulance is on the way with patient...
                    </p>
                  </div>
                )}

                {booking.status === 'completed' && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
                    <p className="text-xs text-red-800 dark:text-red-200">
                      ✓ Booking completed. Ambulance ready for next booking.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Active Bookings Count */}
      {bookings.length > 0 && (
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Showing {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default Schedule;
