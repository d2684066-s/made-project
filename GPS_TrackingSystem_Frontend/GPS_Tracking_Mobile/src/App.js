import React, { Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Core Context & Components
import { AuthProvider, useAuth } from "./core/auth.context";
import { BookingProvider } from "./context/BookingContext";
import { Toaster } from "sonner";
import { Loader } from "./shared/components/UIElements";
import SplashScreen from "./shared/components/SplashScreen";

// Layouts
import { StudentLayout } from "./layout/StudentLayout";
import { DriverLayout } from "./layout/DriverLayout";

// Location Guard
import LocationGuard from "./core/LocationGuard";

// Lazy Loaded Feature Modules
const AuthLogin = React.lazy(() => import('./features/auth/Login'));
const AuthSignup = React.lazy(() => import('./features/auth/Signup'));
const StudentDashboard = React.lazy(() => import('./features/student/Dashboard'));
const StudentTrackBus = React.lazy(() => import('./features/student/TrackBus'));
const StudentBookAmbulance = React.lazy(() => import('./features/student/BookAmbulance'));
const StudentSchedule = React.lazy(() => import('./features/student/Schedule'));
const StudentNotifications = React.lazy(() => import('./features/student/Notifications'));
const StudentProfile = React.lazy(() => import('./features/student/Profile'));
const StudentHelp = React.lazy(() => import('./features/help/Help'));

const DriverDashboard = React.lazy(() => import('./features/driver/Dashboard'));
const DriverVehicleAssignment = React.lazy(() => import('./features/driver/VehicleAssignment'));
const DriverActiveTrip = React.lazy(() => import('./features/driver/ActiveTrip'));
const DriverPendingRequests = React.lazy(() => import('./features/driver/PendingRequests'));
const DriverHelp = React.lazy(() => import('./features/help/Help'));

// Auth Guards
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
        <Loader size="lg" />
      </div>
    );
  }

  if (!user || user.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
        <Loader size="lg" />
      </div>
    }>
      <Routes>
        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth Module */}
        <Route path="/login" element={<AuthLogin />} />
        <Route path="/signup" element={<AuthSignup />} />

        {/* Student Feature Module */}
        <Route path="/student" element={
          <ProtectedRoute allowedRole="student">
            <LocationGuard>
              <StudentLayout />
            </LocationGuard>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="track" element={<StudentTrackBus />} />
          <Route path="book-ambulance" element={<StudentBookAmbulance />} />
          <Route path="schedule" element={<StudentSchedule />} />
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="help" element={<StudentHelp />} />
        </Route>

        {/* Driver Feature Module */}
        <Route path="/driver" element={
          <ProtectedRoute allowedRole="driver">
            <LocationGuard>
              <DriverLayout />
            </LocationGuard>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DriverDashboard />} />
          <Route path="vehicle-assignment" element={<DriverVehicleAssignment />} />
          <Route path="active-trip" element={<DriverActiveTrip />} />
          <Route path="pending-requests" element={<DriverPendingRequests />} />
          <Route path="trip/start" element={<DriverPendingRequests />} /> {/* Redirecting to pending for now */}
          <Route path="route" element={<DriverActiveTrip />} /> {/* Redirecting to active trip map */}
          <Route path="help" element={<DriverHelp />} />
          <Route path="stops" element={<div className="p-8 text-center text-gray-500">Stops management coming soon...</div>} />
          <Route path="settings" element={<div className="p-8 text-center text-gray-500">Settings coming soon...</div>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="App relative font-sans min-h-screen bg-background text-foreground transition-colors duration-300">
      <AuthProvider>
        <BookingProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppRoutes />
          </BrowserRouter>
        </BookingProvider>
      </AuthProvider>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
