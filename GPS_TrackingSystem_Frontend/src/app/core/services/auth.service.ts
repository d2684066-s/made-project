import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'driver' | 'user';
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private userSubject = new BehaviorSubject<User | null>(null);
    public user$ = this.userSubject.asObservable();

    public user = signal<User | null>(null);
    public loading = signal<boolean>(true);

    constructor(private router: Router, private http: HttpClient) {
        this.initAuth();
    }

    private initAuth() {
        const userJson = localStorage.getItem('mock_user');
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                this.userSubject.next(user);
                this.user.set(user);
            } catch (e) {
                localStorage.removeItem('mock_user');
            }
        }
        this.loading.set(false);
    }

    login(credentials: any, type: 'admin' | 'driver' = 'admin'): Observable<any> {
        console.log('🔐 Auth Service: Login attempt', { email: credentials.email });
        
        return this.http.post(`/api/auth/login/`, {
            email: credentials.email,
            password: credentials.password
        }).pipe(
            tap((response: any) => {
                console.log('✅ Auth Service: Login successful', { response });
                
                // Store token and user info. The backend returns `access_token`, so
                // try that first before falling back to other legacy keys.
                const token = response.access_token || response.access || response.token;
                const userData = response.user || response;
                const user: User = {
                    id: userData.id || '1',
                    name: userData.name || credentials.email.split('@')[0],
                    email: userData.email || credentials.email,
                    role: userData.role || type
                };
                
                console.log('💾 Auth Service: Storing user data', { user });
                
                if (token) {
                    localStorage.setItem('gce_token', token);
                }
                localStorage.setItem('mock_user', JSON.stringify(user));
                this.userSubject.next(user);
                this.user.set(user);
            }),
            catchError(error => {
                console.error('❌ Auth Service: Login failed', { 
                    status: error.status,
                    message: error.error?.error || error.error?.detail || error.message,
                    fullError: error 
                });
                const errorMsg = error.error?.detail || error.error?.error || 'Invalid credentials';
                throw new Error(errorMsg);
            })
        );
    }

    signup(userData: any): Observable<any> {
        return this.http.post(`/api/auth/signup/`, {
            email: userData.email,
            password: userData.password,
            name: userData.name
        }).pipe(
            tap((response: any) => {
                const token = response.access_token || response.access || response.token;
                const user: User = {
                    id: response.user_id || response.id || Math.random().toString(36).substr(2, 9),
                    name: userData.name || userData.email.split('@')[0],
                    email: userData.email,
                    role: response.role || 'user'
                };
                
                if (token) {
                    localStorage.setItem('gce_token', token);
                }
                localStorage.setItem('mock_user', JSON.stringify(user));
                this.userSubject.next(user);
                this.user.set(user);
            }),
            catchError(error => {
                throw new Error(error.error?.detail || 'Signup failed');
            })
        );
    }

    logout() {
        localStorage.removeItem('gce_token');
        localStorage.removeItem('mock_user');
        this.userSubject.next(null);
        this.user.set(null);
        this.router.navigate(['/admin/login']);
    }

    getToken(): string | null {
        return localStorage.getItem('gce_token');
    }

    isAuthenticated(): boolean {
        return !!this.user() && !!this.getToken();
    }

    getUser(): User | null {
        return this.user();
    }
}
