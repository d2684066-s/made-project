import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth.context';
import { driverApi } from '../../lib/api';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, Filter, MapPin, Clock, ChevronRight, CheckCircle, XCircle, Activity } from 'lucide-react';

const PendingRequests = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const cachePendingRequests = (requestsList = []) => {
        const ids = requestsList.map((req) => req.id);
        localStorage.setItem('gce_pending_request_count', String(ids.length));
        localStorage.setItem('gce_pending_request_ids', JSON.stringify(ids));

        // Let the layout update immediately when requests change (especially useful on mobile)
        window.dispatchEvent(new CustomEvent('pendingRequestsUpdated', {
            detail: { count: ids.length }
        }));
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await driverApi.getPendingBookings(token);
            const newRequests = response.data.bookings || [];
            setRequests(newRequests);
            cachePendingRequests(newRequests);
        } catch (error) {
            console.error('Failed to fetch pending requests:', error);
            toast.error('Connection Error', {
                description: 'Could not load the request queue.'
            });
            // Use cached count when offline
            const cachedCount = Number(localStorage.getItem('gce_pending_request_count') || 0);
            if (cachedCount > 0) {
                toast.info(`Showing ${cachedCount} cached request(s).`, { duration: 4000 });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id) => {
        try {
            await driverApi.acceptBooking(id, token);
            toast.success('Mission Accepted', {
                description: 'Redirecting to navigation...'
            });
            setRequests((prev) => {
                const updated = prev.filter((req) => req.id !== id);
                cachePendingRequests(updated);
                return updated;
            });
            setTimeout(() => navigate('/driver/active-trip'), 500);
        } catch (error) {
            console.error('Accept booking error details:', error.response?.data);
            const errorDetail = error.response?.data?.detail || error.message;
            toast.error('Cannot Accept Booking', {
                description: errorDetail || 'Failed to accept the booking. Ensure you have an ambulance assigned.'
            });
        }
    };

    const handleAbort = async (id) => {
        try {
            await driverApi.abortBooking(id, token);
            toast.info('Request Declined', {
                description: 'The request has been removed from your queue.'
            });
            setRequests((prev) => {
                const updated = prev.filter((req) => req.id !== id);
                cachePendingRequests(updated);
                return updated;
            });
        } catch (error) {
            toast.error('Operation Failed', {
                description: 'Failed to decline the booking.'
            });
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent dark:scrollbar-thumb-slate-700 min-h-screen">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/driver/dashboard')}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-colors"
                >
                    <ChevronLeft size={18} strokeWidth={3} />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-black tracking-tight">Request Queue</h2>
                    <p className="text-[10px] text-[#137fec] font-bold uppercase tracking-[0.2em]">Incoming Traffic</p>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar pb-2">
                <button className="flex items-center gap-2 bg-[#137fec] text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                    <Filter size={14} />
                    <span>Priority</span>
                </button>
                <button className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95">
                    <span>Nearest</span>
                </button>
                <button className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95">
                    <span>Newest</span>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-[#137fec] mb-4" size={40} />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Scanning Queue...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/30 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl inline-block mb-4 shadow-sm text-slate-200">
                            <CheckCircle size={40} />
                        </div>
                        <h3 className="text-lg font-black mb-1">Queue Empty</h3>
                        <p className="text-sm text-slate-400">All student requests have been handled.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((request, index) => (
                            <div
                                key={request.id}
                                className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group transition-all hover:border-[#137fec]/20"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live Request</span>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${request.priority === 'high' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-blue-500 text-white'}`}>
                                            {request.priority === 'high' ? 'High Priority' : 'Regular'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-5 mb-6">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#137fec]">
                                            {request.priority === 'high' ? <Activity size={28} /> : <MapPin size={28} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black group-hover:text-[#137fec] transition-colors">
                                                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">Name:</span> {request.student_name ? request.student_name : (request.student_registration_id ? `(ID: ${request.student_registration_id})` : 'Anonymous Request')}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock size={12} className="text-slate-400" />
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {new Date(request.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-6 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <MapPin size={16} className="text-slate-400" />
                                            <span className="text-xs font-bold truncate max-w-[200px]">{request.place || request.pickup_location || 'Campus Entrance'}</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300" />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAbort(request.id)}
                                            className="px-6 h-14 bg-slate-50 dark:bg-slate-800 hover:bg-red-500/10 hover:text-red-500 text-slate-400 font-bold rounded-2xl transition-all active:scale-[0.98]"
                                        >
                                            <XCircle size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleAccept(request.id)}
                                            className="flex-1 bg-[#137fec] hover:bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                        >
                                            <CheckCircle size={20} />
                                            <span>Dispatch Now</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingRequests;
