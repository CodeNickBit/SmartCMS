import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);

    // Prevent redirecting to login on the server where localStorage is not available
    if (typeof window === 'undefined') {
        return false;
    }

    // Check for window/localStorage availability (SSR safety)
    if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('token');

        if (token) {
            // User is authenticated (simple token check)
            // Ideally backend verifies this token on API calls
            return true;
        }
    }

    // If not authenticated, redirect to login
    router.navigate(['/login']);
    return false;
};
