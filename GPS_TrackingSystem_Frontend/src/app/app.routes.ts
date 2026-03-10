import { Routes } from '@angular/router';
import { AdminLoginComponent } from './features/auth/pages/admin-login/admin-login.component';
import { AdminSignupComponent } from './features/auth/pages/admin-signup/admin-signup.component';
import { PublicMapComponent } from './features/public/pages/map/public-map.component';
import { AdminLayoutComponent } from './features/admin/components/layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/pages/dashboard/admin-dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { VehiclesListComponent } from './features/admin/pages/vehicles/vehicles-list.component';
import { AddVehicleComponent } from './features/admin/pages/add-vehicle/add-vehicle.component';
import { StudentOffencesComponent } from './features/admin/pages/student-offences/student-offences.component';
import { FacultyOffencesComponent } from './features/admin/pages/faculty-offences/faculty-offences.component';
import { OffencesDashboardComponent } from './features/admin/pages/offences/offences-dashboard.component';
import { StudentListComponent } from './features/admin/pages/students/student-list.component';
import { DriverListComponent } from './features/admin/pages/drivers/driver-list.component';
import { BookingsListComponent } from './features/admin/pages/bookings/bookings-list.component';
import { TripsListComponent } from './features/admin/pages/trips/trips-list.component';
import { SupportListComponent } from './features/admin/pages/support/support-list.component';

export const routes: Routes = [
    // Public Routes
    { path: '', component: PublicMapComponent },
    { path: 'admin/login', component: AdminLoginComponent },
    { path: 'admin/signup', component: AdminSignupComponent },

    // Admin Protected Routes
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', component: AdminDashboardComponent },
            { path: 'vehicles', component: VehiclesListComponent },
            { path: 'add-vehicle', component: AddVehicleComponent },
            { path: 'offences', component: OffencesDashboardComponent },
            { path: 'student-offences', component: StudentOffencesComponent },
            { path: 'faculty-offences', component: FacultyOffencesComponent },
            { path: 'students', component: StudentListComponent },
            { path: 'drivers', component: DriverListComponent },
            { path: 'bookings', component: BookingsListComponent },
            { path: 'trips', component: TripsListComponent },
            { path: 'support', component: SupportListComponent },
            // Add other admin routes here
        ]
    },

    // Fallback
    { path: '**', redirectTo: '' }
];
