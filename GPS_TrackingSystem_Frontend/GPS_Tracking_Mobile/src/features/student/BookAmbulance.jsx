import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth.context';
import { useBooking } from '../../context/BookingContext';
import { MapPin, Navigation, Phone, Info, AlertTriangle, ChevronRight, Activity, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { publicApi } from '../../lib/api';
import { calculateDistance, calculateETA, generateBookingId, getUserLocation, watchUserLocation, stopWatchingLocation } from '../../services/locationService';
import LiveAmbulanceMap from '../../components/LiveAmbulanceMap';
import LocationPicker from '../../components/LocationPicker';
import RefreshHeader from '../../components/RefreshHeader';
import { ALLOWED_LOCATIONS, checkLocationValidity } from '../../config/allowedLocations';

const BookAmbulance = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { activeBooking, hasActiveBooking, createBooking, updateBookingStatus, updateBookingETA, addNotification, completeBooking } = useBooking();
    
    const [booking, setBooking] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState("");
    const [customPlace, setCustomPlace] = useState("");
    const [studentRegId, setStudentRegId] = useState(user?.registration_id || "");
    const [phone, setPhone] = useState(user?.phone || ""); // default to authenticated user's phone
    const [bookingStatus, setBookingStatus] = useState(null); // null, 'waiting', 'accepted', 'on_way', 'completed'
    const [userCoords, setUserCoords] = useState({ lat: null, lng: null });
    const [driverCoords, setDriverCoords] = useState(null);
    const [currentETA, setCurrentETA] = useState(null);
    const [driverInfo, setDriverInfo] = useState(null);
    const [bookingId, setBookingId] = useState(null);
    const [watchId, setWatchId] = useState(null);
    const [showLiveMap, setShowLiveMap] = useState(false);
    const [distanceToDriver, setDistanceToDriver] = useState(null);
    const [driverPhone, setDriverPhone] = useState(null);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [selectedLocationData, setSelectedLocationData] = useState(null);
    const [locationValidationError, setLocationValidationError] = useState(null);

    const places = [
        'BAITARANI HALL OF RESIDENCE',
        'BALADEVJEW HALL OF RESIDENCE',
        'MAA TARINI HALL OF RESIDENCE',
        'GANDHAMARDAN HALL OF RESIDENCE',
        'ADMINISTRATIVE BLOCK'
    ];

    // Get initial location
    useEffect(() => {
        const getLocation = async () => {
            try {
                const location = await getUserLocation();
                setUserCoords(location);
            } catch (err) {
                console.error('Failed to get location:', err);
                toast.error('Could not access your location');
            }
        };
        getLocation();

        return () => {
            if (watchId !== null) {
                stopWatchingLocation(watchId);
            }
        };
    }, []);

    // If already has active booking, show that instead
    if (hasActiveBooking()) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        ←
                    </button>
                    <div className="flex-1">
                        <h2 className="text-xl font-black tracking-tight">Your Active Booking</h2>
                    </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-500/10 border-2 border-yellow-500 p-6 rounded-2xl mb-6">
                    <p className="text-sm font-bold text-yellow-900 dark:text-yellow-200 mb-2">⚠️ Active Booking in Progress</p>
                    <p className="text-xs text-yellow-800 dark:text-yellow-300 mb-4">
                        You already have an active ambulance booking. You cannot book another ambulance until this one is completed.
                    </p>
                    <button
                        onClick={() => navigate('/student/schedule')}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                        View Booking Status →
                    </button>
                </div>

                {/* Show active booking details */}
                {activeBooking && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Booking ID</p>
                            <p className="text-lg font-bold font-mono">{activeBooking.id}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</p>
                            <p className="text-lg font-bold capitalize">{activeBooking.status}</p>
                        </div>
                        {activeBooking.eta && (
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Estimated Arrival</p>
                                <p className="text-lg font-bold text-blue-600">{activeBooking.eta} minutes</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // handlePlaceToggle replaced by handlePlaceSelect earlier
    const handlePlaceSelect = (place) => {
        // single-choice logic
        if (place === selectedPlace) {
            setSelectedPlace('');
            if (place === 'Other') setCustomPlace('');
        } else {
            setSelectedPlace(place);
        }
    };

    const handleConfirm = async () => {
        if (!selectedPlace && !customPlace.trim()) {
            toast.error("Please select a pickup location");
            return;
        }
        if (!studentRegId.trim()) {
            toast.error("Please enter your Student Registration ID");
            return;
        }
        if (!phone.trim()) {
            toast.error("Please enter your phone number");
            return;
        }

        // Geofencing Validation: Check if user is at an allowed location
        if (!selectedLocationData && selectedPlace === 'Other') {
            setLocationValidationError("Please use the location picker to select an allowed pickup location");
            toast.error("Invalid Location", {
                description: "Ambulance service is only available at the 5 designated locations in Kendujhar"
            });
            return;
        }

        // Check if user is within allowed locations
        try {
            const validLocations = checkLocationValidity(userCoords);
            if (validLocations.length === 0 && selectedPlace === 'Other') {
                setLocationValidationError("Your current location is outside the ambulance service area. Please move to one of the 5 designated locations.");
                toast.error("Outside Service Area", {
                    description: `Allowed locations: ${ALLOWED_LOCATIONS.map(l => l.name).join(', ')}`
                });
                return;
            }
        } catch (error) {
            console.error('Location validation error:', error);
            // Continue anyway if validation fails - user can still book
        }

        setLocationValidationError(null);
        setBooking(true);

        try {
            const pickupLocation = selectedPlace === 'Other' ? customPlace : selectedPlace;

            const bkId = generateBookingId();
            setBookingId(bkId);

            const response = await publicApi.bookAmbulance({
                pickup_location: pickupLocation,
                booking_id: bkId,
                student_registration_id: studentRegId,
                student_name: user?.name || '',
                phone: user?.phone || phone,
                place: pickupLocation,
                place_details: selectedLocationData?.placeDetails || customPlace,
                location_id: selectedLocationData?.id,
                user_location: userCoords
            });

            // Create booking in context
            const bookingCreated = createBooking({
                booking_id: bkId,
                student_name: user?.name || '',
                phone: user?.phone || phone,
                place: pickupLocation,
                user_location: userCoords
            });

            if (!bookingCreated.success) {
                throw new Error(bookingCreated.message);
            }

            setBookingStatus('pending');
            toast.success("Booking Submitted!", {
                description: "Waiting for driver acceptance...",
                duration: 5000
            });

            // Start watching location for real-time updates
            const id = watchUserLocation((location) => {
                setUserCoords(location);
            });
            setWatchId(id);

            // Poll for booking status updates
            pollBookingStatus(bkId);

        } catch (error) {
            console.error('Failed to book ambulance:', error);
            toast.error("Dispatch Failed", {
                description: "Unable to connect to emergency services."
            });
            setBooking(false);
            setBookingStatus(null);
        }
    };

    const pollBookingStatus = (bkId) => {
        const interval = setInterval(async () => {
            try {
                // Fetch current bookings to check status
                const response = await publicApi.getMyBookings(token);
                const bookings = response.data.bookings || [];
                const currentBooking = bookings.find(b => b.id === bkId || b.booking_id === bkId);

                if (currentBooking) {
                    const status = currentBooking.status;

                    if (status === 'accepted' && bookingStatus === 'pending') {
                        // Driver accepted
                        setBookingStatus('accepted');
                        const driverPhone = currentBooking.driver_phone || '+91-XXXX-XXXXXX';
                        setDriverPhone(driverPhone);
                        setDriverInfo({
                            name: currentBooking.driver_name || 'Driver',
                            phone: driverPhone,
                            vehicle: currentBooking.vehicle_number || 'AMB-001'
                        });
                        
                        // Initialize driver location for map
                        if (!driverCoords) {
                            setDriverCoords({
                                lat: userCoords.lat + 0.005,
                                lng: userCoords.lng + 0.005
                            });
                        }
                        
                        updateBookingStatus(bkId, 'accepted', {
                            driver_name: currentBooking.driver_name,
                            driver_phone: driverPhone
                        });
                        addNotification(bkId, {
                            type: 'accepted',
                            message: `${currentBooking.driver_name || 'Driver'} has accepted your booking. ARRIVING soon near you. Please wait patiently.`,
                            driverInfo: {
                                name: currentBooking.driver_name || 'Driver',
                                phone: driverPhone,
                                vehicleNumber: currentBooking.vehicle_number || 'AMB-001'
                            }
                        });
                        toast.success("Driver Accepted!", {
                            description: `${currentBooking.driver_name || 'Driver'} is on the way`,
                            duration: 5000
                        });

                        // Start ETA updates
                        updateETAInterval(bkId);
                    } else if (status === 'in_progress' && bookingStatus === 'accepted') {
                        setBookingStatus('on_way');
                    } else if (status === 'completed') {
                        setBookingStatus('completed');
                        completeBooking(bkId);
                        clearInterval(interval);
                    }
                }
            } catch (error) {
                console.error('Error polling booking status:', error);
            }
        }, 2000);

        return interval;
    };

    const updateETAInterval = (bkId) => {
        const etaInterval = setInterval(() => {
            if (userCoords.lat && driverCoords?.lat) {
                const distance = calculateDistance(userCoords, driverCoords);
                const eta = calculateETA(distance);
                setCurrentETA(eta);
                setDistanceToDriver(distance);
                updateBookingETA(bkId, eta, distance);

                // Simulate driver getting closer
                setDriverCoords(prev => ({
                    lat: prev.lat - 0.0001,
                    lng: prev.lng - 0.0001
                }));

                // Notify when arriving soon (< 1 min)
                if (eta < 1) {
                    toast.success("Ambulance Arriving!", {
                        description: "Ambulance is arriving in less than 1 minute",
                        duration: 5000
                    });
                    setBookingStatus('on_way');
                }
            } else if (!driverCoords && userCoords.lat) {
                // Initial driver position (simulated)
                setDriverCoords({
                    lat: userCoords.lat + 0.005,
                    lng: userCoords.lng + 0.005
                });
                setCurrentETA(8);
                setDistanceToDriver(1.5);
            }
        }, 3000); // Update every 3 seconds

        return etaInterval;
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-colors"
                >
                    ←
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-black tracking-tight">Emergency Medical Dispatch</h2>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-[0.2em]">Priority High</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Visual Status */}
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] flex items-center gap-5 relative overflow-hidden">
                    <div className="relative z-10 h-16 w-16 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-500/20">
                        <Activity size={32} strokeWidth={2.5} className={bookingStatus ? 'animate-pulse' : ''} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-red-600 dark:text-red-400 font-black text-lg">
                            {bookingStatus === 'waiting'
                                ? 'Booking Submitted'
                                : bookingStatus === 'accepted'
                                    ? 'Driver Accepted'
                                    : bookingStatus === 'on_way'
                                        ? 'Ambulance Arriving'
                                        : 'Ambulance Request'}
                        </h3>
                        <p className="text-xs text-red-500/70 font-medium">
                            {bookingStatus === 'waiting'
                                ? 'Waiting for driver...'
                                : bookingStatus === 'accepted'
                                    ? `ETA: ${currentETA} mins`
                                    : bookingStatus === 'on_way'
                                        ? 'Arriving soon!'
                                        : 'Quickest response time: ~5 mins'}
                        </p>
                    </div>
                    <AlertTriangle size={80} className="absolute -right-4 -bottom-4 text-red-500/5 -rotate-12" />
                </div>

                {/* Form */}
                {!bookingStatus && (
                    <div className="space-y-5">
                        {/* Student Info */}
                        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Student Information</div>

                            <input
                                type="text"
                                placeholder="Student Registration ID"
                                value={studentRegId}
                                onChange={(e) => setStudentRegId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-[#137fec]/20 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                                required
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={phone}
                                readOnly
                                className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-[#137fec]/20 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                                required
                            />
                        </div>

                        {/* Location Selection */}
                        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin size={16} className="text-[#137fec]" />
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Pickup Location</span>
                            </div>

                            {/* Location Validation Error */}
                            {locationValidationError && (
                                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg text-xs text-red-700 dark:text-red-300">
                                    {locationValidationError}
                                </div>
                            )}

                            {/* Quick Location Picker Button */}
                            <button
                                onClick={() => setShowLocationPicker(true)}
                                className="w-full p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 border-2 border-blue-200 dark:border-blue-500/30 rounded-xl hover:border-blue-400 dark:hover:border-blue-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[#137fec]"
                            >
                                <MapPin size={18} />
                                {selectedLocationData ? `Selected: ${selectedLocationData.name}` : 'Choose from 5 Kendujhar Locations'}
                            </button>

                            {selectedLocationData && (
                                <div className="p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg">
                                    <p className="text-xs font-bold text-green-900 dark:text-green-300 mb-2">✓ Location Confirmed</p>
                                    <div className="space-y-1 text-xs">
                                        <p className="text-slate-600 dark:text-slate-400"><span className="font-bold">Distance from driver:</span> {selectedLocationData.distance} km</p>
                                        <p className="text-slate-600 dark:text-slate-400"><span className="font-bold">ETA:</span> {selectedLocationData.eta} minutes</p>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">Or select other location:</p>
                                <div className="space-y-3">
                                    {['BAITARANI HALL OF RESIDENCE', 'BALADEVJEW HALL OF RESIDENCE', 'MAA TARINI HALL OF RESIDENCE', 'GANDHAMARDAN HALL OF RESIDENCE', 'ADMINISTRATIVE BLOCK'].map((place) => (
                                        <label key={place} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors">
                                            <input
                                                type="radio"
                                                name="pickup"
                                                value={place}
                                                checked={selectedPlace === place}
                                                onChange={() => {
                                                    handlePlaceSelect(place);
                                                    setSelectedLocationData(null);
                                                }}
                                                className="h-5 w-5 text-[#137fec] border-2 border-slate-300 rounded-full focus:ring-[#137fec] focus:ring-2"
                                            />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{place}</span>
                                        </label>
                                    ))}

                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                                        <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors">
                                            <input
                                                type="radio"
                                                name="pickup"
                                                value="Other"
                                                checked={selectedPlace === 'Other'}
                                                onChange={() => {
                                                    handlePlaceSelect('Other');
                                                    setSelectedLocationData(null);
                                                }}
                                                className="h-5 w-5 text-[#137fec] border-2 border-slate-300 rounded-full focus:ring-[#137fec] focus:ring-2"
                                            />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Other Location</span>
                                        </label>
                                        {selectedPlace === 'Other' && (
                                            <input
                                                type="text"
                                                placeholder="Specify location in campus"
                                                value={customPlace}
                                                onChange={(e) => setCustomPlace(e.target.value)}
                                                className="w-full mt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-sm font-medium outline-none border-2 border-transparent focus:border-[#137fec]/20 transition-all"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking Status Display */}
                {bookingStatus === 'accepted' && driverInfo && (
                    <div className="bg-green-50 dark:bg-green-500/10 border border-green-500/30 p-6 rounded-2xl space-y-4">
                        <p className="text-sm font-bold text-green-900 dark:text-green-200 mb-4">✓ Driver Accepted - Ambulance On the Way</p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg">
                                <span className="text-xs font-bold text-slate-500">Driver Name</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{driverInfo.name}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg">
                                <span className="text-xs font-bold text-slate-500">📞 Phone</span>
                                <a href={`tel:${driverInfo.phone}`} className="text-sm font-bold text-[#137fec] hover:underline">
                                    {driverInfo.phone}
                                </a>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg">
                                <span className="text-xs font-bold text-slate-500">Vehicle</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{driverInfo.vehicle}</span>
                            </div>
                            {currentETA && (
                                <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-500/20 rounded-lg border border-blue-300 dark:border-blue-500/50">
                                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200">⏱️ ETA</span>
                                    <span className="text-lg font-black text-blue-600 dark:text-blue-300">{currentETA} min</span>
                                </div>
                            )}
                            <button
                                onClick={() => setShowLiveMap(true)}
                                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 active:scale-[0.98] text-white p-4 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all"
                            >
                                <span>🗺️</span>
                                View Live Tracking
                            </button>
                        </div>
                    </div>
                )}

                {/* Confirm Button */}
                <div className="pt-4 px-2 space-y-4">
                    {bookingStatus === 'waiting' && (
                        <div className="w-full bg-yellow-500 text-white p-6 rounded-[2rem] font-black text-center shadow-2xl shadow-yellow-500/30">
                            <div className="flex items-center justify-center gap-3">
                                <Loader2 className="animate-spin" size={24} />
                                <span>Waiting for Driver Acceptance...</span>
                            </div>
                        </div>
                    )}

                    {bookingStatus === 'accepted' && (
                        <div className="w-full bg-green-500 text-white p-6 rounded-[2rem] font-black text-center shadow-2xl shadow-green-500/30">
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-2xl">✓</span>
                                <span>Ambulance Arriving in {currentETA} minutes</span>
                            </div>
                        </div>
                    )}

                    {bookingStatus === 'on_way' && (
                        <div className="w-full bg-red-500 text-white p-6 rounded-[2rem] font-black text-center shadow-2xl shadow-red-500/30 animate-pulse">
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-2xl">🚑</span>
                                <span>Ambulance arriving NOW!</span>
                            </div>
                        </div>
                    )}

                    {!bookingStatus && (
                        <button
                            onClick={handleConfirm}
                            disabled={booking}
                            className="w-full bg-red-500 hover:bg-red-600 active:scale-[0.98] disabled:opacity-50 text-white p-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-red-500/30 flex items-center justify-center gap-4 transition-all"
                        >
                            {booking ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <span>🚑</span>
                                    Confirm Emergency Dispatch
                                </>
                            )}
                        </button>
                    )}

                    <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <Info size={14} className="text-slate-400 mt-1 shrink-0" />
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                            Emergency services are for critical incidents only. False bookings may result in disciplinary action.
                        </p>
                    </div>
                </div>

                {/* Live Ambulance Map Modal */}
                {showLiveMap && userCoords && (
                    <LiveAmbulanceMap
                        studentLoc={userCoords}
                        driverLoc={driverCoords || [0, 0]}
                        destination={selectedPlace === 'Other' ? customPlace : selectedPlace}
                        eta={currentETA}
                        distance={distanceToDriver}
                        driverPhone={driverPhone || driverInfo?.phone}
                        onClose={() => setShowLiveMap(false)}
                    />
                )}

                {/* Location Picker Modal */}
                {showLocationPicker && (
                    <LocationPicker 
                        onLocationSelected={(location) => {
                            setSelectedLocationData(location);
                            setSelectedPlace(location.name);
                            setShowLocationPicker(false);
                        }}
                        onClose={() => setShowLocationPicker(false)}
                        driverLocation={null}
                        showDistance={false}
                    />
                )}
            </div>
        </div>
    );
};

export default BookAmbulance;
