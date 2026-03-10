import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth.context';
import { driverApi } from '../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Bus, Siren } from 'lucide-react';

const VehicleAssignment = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();

    const [vehicles, setVehicles] = useState([]);
    const [assignedVehicle, setAssignedVehicle] = useState(null);
    const [vehicleType, setVehicleType] = useState(user?.driver_type === 'bus' ? 'Bus' : 'Ambulance');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [vehicleType]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch available vehicles
            const typeParam = vehicleType.toLowerCase();
            const vehiclesResponse = await driverApi.getAvailableVehicles(typeParam, token);
            const availableVehicles = vehiclesResponse.data.vehicles || [];
            setVehicles(availableVehicles);

            // Check for assigned vehicle (either from active trip or from available vehicles list)
            const activeTripResponse = await driverApi.getActiveTrip(token);
            if (activeTripResponse.data.trip) {
                setAssignedVehicle(activeTripResponse.data.trip.vehicle_id);
            } else {
                // Check if any vehicle is assigned to the current user
                const assignedVeh = availableVehicles.find(v => v.assigned_to === user?.id);
                if (assignedVeh) {
                    setAssignedVehicle(assignedVeh.id || assignedVeh.vehicle_id);
                } else {
                    setAssignedVehicle(null);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (vehicleId) => {
        try {
            await driverApi.assignVehicle(vehicleId, token);
            if (assignedVehicle && assignedVehicle !== vehicleId) {
                toast.success(`Vehicle swapped successfully to ${vehicleId}.`);
            } else {
                toast.success(`Vehicle ${vehicleId} assigned successfully.`);
            }
            setAssignedVehicle(vehicleId);
        } catch (error) {
            toast.error('Failed to assign vehicle.');
        }
    };

    const handleRelease = async () => {
        if (!assignedVehicle) return;
        try {
            await driverApi.releaseVehicle(assignedVehicle, token);
            setAssignedVehicle(null);
            toast.info('Vehicle released. Please select a new one.');
        } catch (error) {
            toast.error('Failed to release vehicle.');
            console.error(error);
        }
    };

    return (
        <div className="bg-[#f6f7f8] dark:bg-[#101922] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[#f6f7f8]/80 dark:bg-[#101922]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-4 py-4 max-w-md mx-auto w-full">
                    <button
                        onClick={() => navigate('/driver/dashboard')}
                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors active:scale-95"
                        title="Go back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Vehicle Assignment</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto pb-24 max-w-md mx-auto w-full px-4 pt-6">

                {/* Current Assignment */}
                {assignedVehicle && (
                    <div className="mb-8">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">Current Assignment</h2>
                        <div className="bg-[#137fec]/10 flex flex-col sm:flex-row gap-4 sm:items-center justify-between border border-[#137fec]/30 rounded-xl p-4 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-lg bg-[#137fec] flex items-center justify-center text-white shrink-0 shadow-sm">
                                    {vehicleType === 'Bus' ? <Bus size={24} /> : <Siren size={24} />}
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-[#137fec] truncate max-w-[150px]">{vehicleType} - {assignedVehicle}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Route: {vehicleType === 'Bus' ? 'Campus Route' : 'Emergency Standby'}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleRelease}
                                className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm active:scale-95 w-full sm:w-auto"
                            >
                                Release
                            </button>
                        </div>
                    </div>
                )}

                {/* Select Vehicle Category Options */}
                <div className="mb-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">Select Vehicle Category</h2>
                    <div className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 p-1 shadow-inner">
                        <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all text-sm font-semibold ${vehicleType === 'Bus' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#137fec] dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                            <span className="truncate flex items-center gap-2">
                                <Bus size={16} /> Bus
                            </span>
                            <input
                                checked={vehicleType === 'Bus'}
                                onChange={() => setVehicleType('Bus')}
                                className="hidden"
                                name="vehicle-type"
                                type="radio"
                                value="Bus"
                            />
                        </label>
                        <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all text-sm font-semibold ${vehicleType === 'Ambulance' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#137fec] dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                            <span className="truncate flex items-center gap-2">
                                <Siren size={16} /> Ambulance
                            </span>
                            <input
                                checked={vehicleType === 'Ambulance'}
                                onChange={() => setVehicleType('Ambulance')}
                                className="hidden"
                                name="vehicle-type"
                                type="radio"
                                value="Ambulance"
                            />
                        </label>
                    </div>
                </div>

                {/* Available Vehicles List */}
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 px-1">Available Vehicles</h2>
                <div className="space-y-3">
                    {loading ? (
                        <div className="py-8 text-center text-slate-500">Loading vehicles...</div>
                    ) : vehicles.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                            No vehicles available
                        </div>
                    ) : (
                        vehicles.map((v) => (
                            <div key={v.id || v.vehicle_id} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-3 rounded-xl hover:border-[#137fec]/50 transition-colors shadow-sm">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="text-slate-600 dark:text-slate-300 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 h-12 w-12">
                                        {vehicleType === 'Bus' ? <Bus size={20} /> : <Siren size={20} />}
                                    </div>
                                    <div className="flex flex-col justify-center flex-1">
                                        <p className="text-slate-900 dark:text-slate-100 text-base font-semibold leading-normal line-clamp-1">{vehicleType} - {v.vehicle_number || v.number || v.id || v.vehicle_id}</p>
                                        <p className={`text-xs font-medium leading-normal ${assignedVehicle === (v.id || v.vehicle_id) ? 'text-blue-500' : 'text-emerald-500'}`}>
                                            {assignedVehicle === (v.id || v.vehicle_id) ? '✓ Assigned to You' : 'Ready for Duty'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAssign(v.id || v.vehicle_id)}
                                    // Make buttons look slightly disabled if already assigned this one
                                    disabled={assignedVehicle === (v.id || v.vehicle_id)}
                                    className={`flex w-full sm:min-w-[80px] sm:w-auto items-center justify-center rounded-lg h-10 px-4 text-white text-sm font-bold transition-all active:scale-95 ${assignedVehicle === (v.id || v.vehicle_id) ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-[#137fec] hover:bg-[#137fec]/90 shadow-sm'}`}
                                >
                                    {assignedVehicle === (v.id || v.vehicle_id) ? 'Assigned' : 'Assign'}
                                </button>
                            </div>
                        ))
                    )}

                    {/* Mock Out of service vehicle for UI flair as seen in design */}
                    {!loading && vehicles.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-3 rounded-xl opacity-60 shadow-sm">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="text-slate-600 dark:text-slate-300 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 h-12 w-12">
                                    {vehicleType === 'Bus' ? <Bus size={20} /> : <Siren size={20} />}
                                </div>
                                <div className="flex flex-col justify-center flex-1">
                                    <p className="text-slate-900 dark:text-slate-100 text-base font-semibold leading-normal line-clamp-1">{vehicleType} - X-999</p>
                                    <p className="text-amber-500 text-xs font-medium leading-normal">Maintenance Required</p>
                                </div>
                            </div>
                            <button
                                disabled
                                className="flex w-full sm:min-w-[80px] sm:w-auto items-center justify-center rounded-lg h-10 px-4 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold cursor-not-allowed"
                            >
                                Assign
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default VehicleAssignment;
