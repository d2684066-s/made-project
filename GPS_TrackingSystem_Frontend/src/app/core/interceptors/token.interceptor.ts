import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    // do not attach auth header to the safety_app endpoints since they are
    // intentionally open and our frontend uses a mock token which the Django
    // backend does not recognise (causing 401 errors).
    if (token && !req.url.includes('/safety/api/')) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req);
};
