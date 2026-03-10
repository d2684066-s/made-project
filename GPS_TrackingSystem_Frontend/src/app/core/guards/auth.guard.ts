import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Wait for loading to finish
    if (authService.loading()) {
        // This part is tricky with signals in guards, 
        // but we can convert signal to observable to wait
        // For simplicity in this implementation step, we assume loading is fast or we redirect if not loaded
        // A robust implementation would wait for loading signal to be false.
        return toObservable(authService.loading).pipe(
            filter(loading => !loading),
            take(1),
            map(() => checkAuth(authService, router, route))
        );
    }

    return checkAuth(authService, router, route);
};

function checkAuth(authService: AuthService, router: Router, route: any): boolean {
    const user = authService.getUser();
    const expectedRole = route.data?.['role'];

    if (!user) {
        if (expectedRole === 'admin') {
            router.navigate(['/admin/login']);
        } else if (expectedRole === 'driver') {
            router.navigate(['/driver']);
        } else {
            router.navigate(['/login']);
        }
        return false;
    }

    if (expectedRole && user.role !== expectedRole) {
        // Redirect to appropriate dashboard based on actual role
        if (user.role === 'admin') router.navigate(['/admin']);
        else if (user.role === 'driver') router.navigate(['/driver/bus/work']); // Default driver page
        else router.navigate(['/']);
        return false;
    }

    return true;
}
