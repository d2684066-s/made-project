import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { driverApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Bus, LogOut, Play, Square, MapPinOff, Loader2 } from 'lucide-react';

const BusWork = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [assignedVehicle, setAssignedVehicle] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [status, setStatus] = useState('Offline');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchActiveTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await driverApi.getAvailableVehicles('bus', token);
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  };

  const fetchActiveTrip = async () => {
    try {
      const response = await driverApi.getActiveTrip(token);
      if (response.data.trip) {
        setActiveTrip(response.data.trip);
        setSelectedVehicle(response.data.trip.vehicle_id);
        setAssignedVehicle(response.data.trip.vehicle_id);
        setStatus('On Duty - Trip Active');
      } else {
        // Check if driver has any assigned vehicle even without active trip
        const vehiclesResponse = await driverApi.getAvailableVehicles('bus', token);
        const assignedVeh = vehiclesResponse.data.vehicles?.find(v => v.assigned_to === user?.id);
        if (assignedVeh) {
          setAssignedVehicle(assignedVeh.id);
          setSelectedVehicle(assignedVeh.id);
          setStatus('On Duty - Ready');
        }
      }
    } catch (error) {
      console.error('Failed to fetch active trip:', error);
    }
  };

  const handleOnDuty = async () => {
    if (!selectedVehicle) {
      toast.error('Please select a bus');
      return;
    }
    setLoading(true);
    try {
      await driverApi.assignVehicle(selectedVehicle, token);
      setStatus('On Duty - Ready');
      if (assignedVehicle && assignedVehicle !== selectedVehicle) {
        toast.success(`Vehicle swapped successfully. Ready for duty.`);
      } else {
        toast.success('Vehicle assigned. Ready for duty.');
      }
      setAssignedVehicle(selectedVehicle);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleOffDuty = async () => {
    setLoading(true);
    try {
      if (activeTrip) {
        await driverApi.endTrip(activeTrip.id, token);
      }
      if (selectedVehicle) {
        await driverApi.releaseVehicle(selectedVehicle, token);
      }
      setActiveTrip(null);
      setAssignedVehicle(null);
      setStatus('Offline');
      toast.success('Off duty');
      logout();
      navigate('/driver');
    } catch (error) {
      toast.error('Failed to go off duty');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async () => {
    if (!selectedVehicle) {
      toast.error('Please select and assign a bus first');
      return;
    }
    setLoading(true);
    try {
      const response = await driverApi.startTrip(selectedVehicle, token);
      setActiveTrip(response.data);
      setStatus('Trip Started - GPS Active');
      toast.success('Trip started! GPS tracking active.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start trip');
    } finally {
      setLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!activeTrip) return;
    setLoading(true);
    try {
      await driverApi.endTrip(activeTrip.id, token);
      setActiveTrip(null);
      setStatus('On Duty - Ready');
      toast.success('Trip ended');
    } catch (error) {
      toast.error('Failed to end trip');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOutOfStation = async () => {
    if (!selectedVehicle) return;
    try {
      await driverApi.markOutOfStation(selectedVehicle, true, token);
      toast.success('Marked as out of station');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleVehicleChange = async (newVehicleId) => {
    // If there's an active trip, prevent direct switching
    if (activeTrip && activeTrip.vehicle_id !== newVehicleId) {
      toast.info('Trip In Progress', {
        description: 'Please end your current trip before switching vehicles.'
      });
      return;
    }
    setSelectedVehicle(newVehicleId);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="bus-work-page">
      {/* Header */}
      <div className="bg-sky-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bus className="h-6 w-6" />
          <span className="font-semibold">Bus Driver – {user?.name}</span>
        </div>
        <Button 
          variant="ghost" 
          className="text-white hover:bg-sky-600"
          onClick={handleOffDuty}
          disabled={loading}
        >
          <LogOut className="h-4 w-4 mr-2" />
          OFF DUTY
        </Button>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Current Assignment Status */}
        {assignedVehicle && (
          <div className="p-4 rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-200 font-medium">
              ✓ Currently Assigned: <span className="font-bold">{vehicles.find(v => v.id === assignedVehicle)?.vehicle_number || assignedVehicle}</span>
            </p>
          </div>
        )}

        {/* Select Bus */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-lg mb-4 text-foreground">Select Bus</h3>
          <Select value={selectedVehicle} onValueChange={handleVehicleChange}>
            <SelectTrigger data-testid="bus-select">
              <SelectValue placeholder="Select Bus" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.vehicle_number}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleOnDuty} 
            className="w-full mt-4 bg-green-500 hover:bg-green-600"
            disabled={loading || !selectedVehicle || !!activeTrip}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {selectedVehicle === assignedVehicle ? 'ALREADY ASSIGNED' : 'ON DUTY'}
          </Button>
          {activeTrip && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
              💡 End your current trip to switch to a different vehicle
            </p>
          )}
        </div>

        {/* Status & Controls */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold text-lg mb-4 text-foreground">Status</h3>
          <p className={`text-lg font-mono mb-4 ${status.includes('Active') ? 'text-green-500' : 'text-muted-foreground'}`}>
            {status}
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleStartTrip}
              className="bg-sky-500 hover:bg-sky-600"
              disabled={loading || !!activeTrip}
              data-testid="start-trip-btn"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Trip
            </Button>
            <Button 
              onClick={handleEndTrip}
              variant="outline"
              disabled={loading || !activeTrip}
              data-testid="end-trip-btn"
            >
              <Square className="h-4 w-4 mr-2" />
              End Trip
            </Button>
          </div>

          <Button 
            onClick={handleMarkOutOfStation}
            variant="outline"
            className="w-full mt-4 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
            disabled={!selectedVehicle}
          >
            <MapPinOff className="h-4 w-4 mr-2" />
            Mark Out of Station
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusWork;
