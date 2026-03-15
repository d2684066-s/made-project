import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs'; // 'of' kept for optional fallback
import { delay } from 'rxjs/operators'; // only used by mocks if needed
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiService {

    // Mock Data
    private mockStats = {
        total_buses: 25,
        total_ambulances: 10,
        active_trips: 18,
        unpaid_offences: 5
    };

    private mockTrips = [
        {
            id: '1',
            vehicle_number: 'WB-02-AB-1234',
            driver_name: 'John Doe',
            current_speed: 45,
            vehicle_type: 'bus',
            lat: 22.5726, // Kolkata
            lng: 88.3639,
            status: 'ACTIVE'
        },
        {
            id: '2',
            vehicle_number: 'WB-04-CD-5678',
            driver_name: 'Jane Smith',
            current_speed: 30,
            vehicle_type: 'ambulance',
            lat: 22.5958, // Nearby
            lng: 88.2636,
            status: 'ACTIVE'
        },
        {
            id: '3',
            vehicle_number: 'WB-06-EF-9012',
            driver_name: 'Mike Johnson',
            current_speed: 55, // Overspeeding mock
            vehicle_type: 'bus',
            lat: 22.5646,
            lng: 88.3433,
            status: 'ACTIVE'
        }
    ];

    constructor(private http: HttpClient) { }

    // Admin API
    getStats(): Observable<any> {
        return this.http.get(`${environment.apiUrl}/api/admin/stats/`);
    }

    getVehicles(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get(`${environment.apiUrl}/api/admin/vehicles/list/`, { params: httpParams });
    }

    // Fetch trips (used by dashboard)
    getTrips(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get(`${environment.apiUrl}/api/admin/trips/`, { params: httpParams });
    }

    // ... other methods can be implemented similarly using HttpClient
    addVehicle(data: any): Observable<any> { return this.http.post(`${environment.apiUrl}/api/admin/vehicles/`, data); }
    deleteVehicle(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/api/admin/vehicles/${id}/`); }

    // Help/Issue management
    getIssues(): Observable<any> { return this.http.get(`${environment.apiUrl}/api/admin/issues/`); }
    pushIssue(id: string): Observable<any> { return this.http.post(`${environment.apiUrl}/api/admin/issues/${id}/push/`, {}); }
    deleteIssue(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/api/admin/issues/${id}/`); }

    getStudents(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get(`${environment.apiUrl}/api/admin/students/`, { params: httpParams });
    }
    deleteUser(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/api/admin/users/${id}/`); }
    deleteStudent(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/api/admin/students/${id}/`); }
    getDrivers(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get(`${environment.apiUrl}/api/admin/drivers/`, { params: httpParams });
    }
    deleteDriver(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/api/admin/drivers/${id}/`); }
    getFaculty(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get(`${environment.apiUrl}/safety/faculty/`, { params: httpParams });
    }
    deleteFaculty(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/safety/faculty/${id}/`); }
    getOffences(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get(`${environment.apiUrl}/api/admin/offences/`, { params: httpParams });
    }
    deleteOffence(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/api/admin/offences/${id}/`); }
    markOffencePaid(id: string): Observable<any> { return this.http.post(`${environment.apiUrl}/api/admin/offences/${id}/mark-paid/`, {}); }
    
    // Student Offences
    getStudentOffences(params?: any): Observable<any> { 
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get(`${environment.apiUrl}/safety/student-offences/`, { params: httpParams });
    }
    createStudentOffence(data: any): Observable<any> { return this.http.post(`${environment.apiUrl}/safety/student-offences/`, data); }
    addStudentProfile(data: any): Observable<any> { return this.http.post(`${environment.apiUrl}/safety/students/`, data); }
    deleteStudentOffence(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/safety/student-offences/${id}/`); }
    markStudentOffenceAsPaid(id: string, receiptFile: File): Observable<any> {
        const formData = new FormData();
        formData.append('receipt_pdf', receiptFile);
        return this.http.post(`${environment.apiUrl}/safety/student-offences/${id}/mark-paid/`, formData);
    }
    
    // Faculty Offences
    getFacultyOffences(params?: any): Observable<any> { 
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get(`${environment.apiUrl}/safety/faculty-offences/`, { params: httpParams });
    }
    createFacultyOffence(data: any): Observable<any> { return this.http.post(`${environment.apiUrl}/safety/faculty-offences/`, data); }
    addFacultyProfile(data: any): Observable<any> { return this.http.post(`${environment.apiUrl}/safety/faculty/`, data); }
    deleteFacultyOffence(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/safety/faculty-offences/${id}/`); }
    markFacultyOffenceAsPaid(id: string, receiptFile: File): Observable<any> {
        const formData = new FormData();
        formData.append('receipt_pdf', receiptFile);
        return this.http.post(`${environment.apiUrl}/safety/faculty-offences/${id}/mark-paid/`, formData);
    }
    
    getBookings(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get(`${environment.apiUrl}/api/admin/bookings/`, { params: httpParams });
    }

    // Driver API placeholders
    getAvailableVehicles(type: string): Observable<any> { return this.http.get(`${environment.apiUrl}/api/driver/available-vehicles/${type}/`); }
    assignVehicle(id: string): Observable<any> { return this.http.post(`${environment.apiUrl}/api/driver/assign-vehicle/${id}/`, {}); }
    releaseVehicle(id: string): Observable<any> { return this.http.post(`${environment.apiUrl}/api/driver/release-vehicle/${id}/`, {}); }
    startTrip(vehicleId: string): Observable<any> { return this.http.post(`${environment.apiUrl}/api/driver/start-trip/`, { vehicle_id: vehicleId }); }
    endTrip(tripId: string): Observable<any> { return this.http.post(`${environment.apiUrl}/api/driver/end-trip/${tripId}/`, {}); }
    getActiveTrip(): Observable<any> { return this.http.get(`${environment.apiUrl}/api/driver/active-trip/`); }
    getMyTrips(): Observable<any> { return this.http.get(`${environment.apiUrl}/api/driver/my-trips/`); }
    markOutOfStation(vehicleId: string, isOut: boolean): Observable<any> { return this.http.post(`${environment.apiUrl}/api/driver/mark-out-of-station/${vehicleId}/`, { is_out_of_station: isOut }); }
    getPendingBookings(): Observable<any> { return this.http.get(`${environment.apiUrl}/api/driver/pending-bookings/`); }
    acceptBooking(id: string): Observable<any> { return this.http.post(`${environment.apiUrl}/api/driver/accept-booking/${id}/`, {}); }
    abortBooking(id: string): Observable<any> { return this.http.post(`${environment.apiUrl}/api/driver/abort-booking/${id}/`, {}); }
    verifyOTP(bookingId: string, otp: string): Observable<any> { return this.http.post(`${environment.apiUrl}/api/driver/verify-otp/`, { booking_id: bookingId, otp }); }
    completeBooking(id: string): Observable<any> { return this.http.post(`${environment.apiUrl}/api/driver/complete-booking/${id}/`, {}); }

    // Public API placeholders
    getPublicBuses(): Observable<any> { return this.http.get(`${environment.apiUrl}/api/public/buses/`); }
    getBusETA(busId: string, lat: number, lng: number): Observable<any> {
        let params = new HttpParams().set('user_lat', lat).set('user_lng', lng);
        return this.http.get(`${environment.apiUrl}/api/public/bus/${busId}/eta/`, { params });
    }
    getAmbulances(): Observable<any> { return this.http.get(`${environment.apiUrl}/api/public/ambulances/`); }
    bookAmbulance(data: any): Observable<any> { return this.http.post(`${environment.apiUrl}/api/public/ambulance/book/`, data); }
    getBooking(id: string): Observable<any> { return this.http.get(`${environment.apiUrl}/api/public/my-bookings/` + id); }
    getMyBookings(): Observable<any> { return this.http.get(`${environment.apiUrl}/api/public/my-bookings/`); }
    deleteBooking(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/api/admin/bookings/${id}/`); }
    deleteTrip(id: string): Observable<any> { return this.http.delete(`${environment.apiUrl}/api/admin/trips/${id}/`); }
}
