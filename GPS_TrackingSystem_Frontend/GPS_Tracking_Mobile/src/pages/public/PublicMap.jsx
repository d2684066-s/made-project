import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { publicApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Truck, X, MapPin, Navigation, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';

// leaflet map imports
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// fix default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const PLACES = [
  { value: '1', label: 'BAITARANI HALL OF RESIDENCE' },
  { value: '2', label: 'BALADEVJEW HALL OF RESIDENCE' },
  { value: '3', label: 'MAA TARINI HALL OF RESIDENCE' },
  { value: '4', label: 'GANDHAMARDAN HALL OF RESIDENCE' },
  { value: '5', label: 'ADMINISTRATIVE BLOCK' },
  { value: '6', label: 'Other (please specify)' },
];

// Keonjhar center coordinates
const CENTER = { lat: 21.6300, lng: 85.5800 };

const PublicMap = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [showServicePopup, setShowServicePopup] = useState(false);
  const [showAmbulancePopup, setShowAmbulancePopup] = useState(false);
  const [buses, setBuses] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [allOutOfStation, setAllOutOfStation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [etaInfo, setEtaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({
    student_registration_id: '',
    phone: '',
    place: '',
    place_details: ''
  });
  const [activeBooking, setActiveBooking] = useState(null);

  useEffect(() => {
    fetchBuses();
    // Try to get user location in background (don't block UI)
    tryGetLocation();
    const interval = setInterval(fetchBuses, 5000);
    return () => clearInterval(interval);
  }, []);

  const tryGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.log('Location not available, using default center');
          setUserLocation(CENTER); // Use default location
        },
        { timeout: 5000 }
      );
    } else {
      setUserLocation(CENTER);
    }
  };

  const fetchBuses = async () => {
    try {
      const response = await publicApi.getBuses();
      setBuses(response.data.buses || []);
      setAllOutOfStation(response.data.all_out_of_station || false);
      setStatusMessage(response.data.message || '');
    } catch (error) {
      console.error('Failed to fetch buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenService = () => {
    // Open popup directly without requiring location first
    setShowServicePopup(true);
  };

  const handleSelectBus = async () => {
    setShowServicePopup(false);

    if (allOutOfStation) {
      toast.info('All buses are out of station');
      return;
    }

    if (buses.length === 0) {
      toast.info(statusMessage || 'No active buses at the moment');
      return;
    }

    // Select first bus
    setSelectedBus(buses[0]);

    // Calculate ETA if we have user location
    if (buses[0] && userLocation) {
      try {
        const response = await publicApi.getBusETA(buses[0].vehicle_id, userLocation.lat, userLocation.lng);
        setEtaInfo(response.data);
        if (response.data.eta_minutes) {
          toast.success(`Nearest Bus ETA: ${response.data.eta_minutes} minutes`);
        } else {
          toast.info('Bus location not yet available');
        }
      } catch (error) {
        console.error('Failed to get ETA:', error);
      }
    } else {
      toast.info(`Bus ${buses[0].vehicle_number} is active`);
    }
  };

  const handleSelectAmbulance = () => {
    setShowServicePopup(false);

    if (!user) {
      toast.error('Please login to book an ambulance');
      navigate('/login');
      return;
    }

    setBookingForm({
      ...bookingForm,
      student_registration_id: user.registration_id || '',
      phone: user.phone || ''
    });
    setShowAmbulancePopup(true);
  };

  const handleBookAmbulance = async () => {
    if (!bookingForm.student_registration_id || !bookingForm.phone || !bookingForm.place) {
      toast.error('Please fill all required fields');
      return;
    }

    // Use user location or default center
    const location = userLocation || CENTER;

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/public/ambulance/book`, {
        ...bookingForm,
        user_location: location
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setActiveBooking(response.data);
      setShowAmbulancePopup(false);
      toast.success('Ambulance booked! Waiting for driver...');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
  };

  return (
    <div className="min-h-screen bg-background relative" data-testid="public-map">
      {/* Header */}
      <div className="bg-sky-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-xl">College Transport System</h1>
            <p className="text-sm text-white/80">GCE Campus</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-sky-600"
            onClick={fetchBuses}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Map Area */}
      <div className="relative h-[calc(100vh-180px)] bg-zinc-900 z-0">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="h-12 w-12 text-sky-500 animate-spin" />
          </div>
        )}

        {/* Leaflet Map */}
        <MapContainer
          center={[CENTER.lat, CENTER.lng]}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Bus Markers */}
          {buses.map((bus) => {
            const loc = bus.location || {};
            if (!loc.lat || !loc.lng) return null;
            return (
              <Marker
                key={bus.vehicle_id}
                position={[loc.lat, loc.lng]}
                eventHandlers={{
                  click: () => setSelectedBus(bus),
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{bus.vehicle_number}</p>
                    <p>{bus.driver_name}</p>
                    {bus.location?.speed && <p className="text-xs">{bus.location.speed} km/h</p>}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* User Location Marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>You are here</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Bus Status Cards (Overlay) */}
        {!loading && buses.length > 0 && (
          <div className="absolute top-4 left-4 right-4 z-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
              {buses.map((bus) => (
                <div
                  key={bus.vehicle_id}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${selectedBus?.vehicle_id === bus.vehicle_id
                      ? 'bg-sky-500/30 border-2 border-sky-500'
                      : 'bg-card/80 border border-border hover:border-sky-500/50'
                    }`}
                  onClick={() => setSelectedBus(bus)}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-sky-500/20 rounded-full">
                      <Truck className="h-5 w-5 text-sky-500" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-foreground text-sm">{bus.vehicle_number}</p>
                      <p className="text-xs text-muted-foreground">{bus.driver_name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Buses Message */}
        {!loading && buses.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center p-6 rounded-lg bg-card/50 border border-border">
              {allOutOfStation ? (
                <>
                  <Truck className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-yellow-500 font-medium">All buses are out of station</p>
                </>
              ) : (
                <>
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">{statusMessage || 'No active buses'}</p>
                  <p className="text-xs text-muted-foreground mt-1">Check back later</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Selected Bus Info */}
        {selectedBus && (
          <div className="absolute bottom-4 left-4 right-4 p-4 rounded-lg glass">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-sky-500">{selectedBus.vehicle_number}</p>
                <p className="text-sm text-muted-foreground">{selectedBus.driver_name}</p>
                {etaInfo?.eta_minutes && (
                  <p className="text-green-500 font-mono mt-1">ETA: {etaInfo.eta_minutes} min ({etaInfo.distance_km} km)</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setSelectedBus(null); setEtaInfo(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Active Booking Info */}
        {activeBooking && (
          <div className="absolute top-4 left-4 right-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-500">Ambulance Booked</span>
            </div>
            <p className="text-sm text-foreground">Status: <span className="capitalize">{activeBooking.status}</span></p>
            {activeBooking.otp && (
              <p className="text-lg font-mono text-green-500 mt-2">Your OTP: {activeBooking.otp}</p>
            )}
            {activeBooking.eta_minutes && (
              <p className="text-sky-500 font-mono">ETA: {activeBooking.eta_minutes} min</p>
            )}
          </div>
        )}
      </div>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur border-t border-border">
        <div className="flex justify-center gap-4 items-center">
          {!user ? (
            <>
              <Button variant="outline" onClick={() => navigate('/login')} data-testid="login-btn">Login</Button>
              <Button variant="outline" onClick={() => navigate('/signup')} data-testid="signup-btn">Sign Up</Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
            </>
          )}
        </div>
      </div>

      {/* Floating + Button */}
      <button
        onClick={handleOpenService}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-sky-500 text-white text-3xl font-bold shadow-lg hover:bg-sky-600 transition-all active:scale-95 flex items-center justify-center z-50"
        data-testid="add-service-btn"
      >
        <Plus className="h-8 w-8" />
      </button>

      {/* Service Selection Popup */}
      <Dialog open={showServicePopup} onOpenChange={setShowServicePopup}>
        <DialogContent className="bg-card border-border z-50">
          <DialogHeader>
            <DialogTitle className="font-heading">Select Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Button
              onClick={handleSelectBus}
              className="w-full h-16 text-xl bg-sky-500 hover:bg-sky-600"
              data-testid="select-bus-btn"
            >
              <Truck className="h-6 w-6 mr-3" />
              Bus ({buses.length} active)
            </Button>
            <Button
              onClick={handleSelectAmbulance}
              className="w-full h-16 text-xl bg-red-500 hover:bg-red-600"
              data-testid="select-ambulance-btn"
            >
              <Truck className="h-6 w-6 mr-3" />
              Ambulance
            </Button>
            <Button variant="outline" onClick={() => setShowServicePopup(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ambulance Booking Popup */}
      <Dialog open={showAmbulancePopup} onOpenChange={setShowAmbulancePopup}>
        <DialogContent className="bg-card border-border z-50">
          <DialogHeader>
            <DialogTitle className="font-heading">Ambulance Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>College ID</Label>
              <Input
                placeholder="Enter College ID"
                value={bookingForm.student_registration_id}
                onChange={(e) => setBookingForm({ ...bookingForm, student_registration_id: e.target.value })}
                data-testid="college-id-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="Enter Phone Number"
                value={bookingForm.phone}
                onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Pickup Location</Label>
              <Select value={bookingForm.place} onValueChange={(v) => setBookingForm({ ...bookingForm, place: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {PLACES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {bookingForm.place === '6' && (
              <div className="space-y-2">
                <Label>Specify Location</Label>
                <Input
                  placeholder="Enter location details"
                  value={bookingForm.place_details}
                  onChange={(e) => setBookingForm({ ...bookingForm, place_details: e.target.value })}
                />
              </div>
            )}
            <Button
              onClick={handleBookAmbulance}
              className="w-full bg-red-500 hover:bg-red-600"
              disabled={loading}
              data-testid="book-ambulance-btn"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Book Ambulance
            </Button>
            <Button variant="outline" onClick={() => setShowAmbulancePopup(false)} className="w-full">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicMap;
