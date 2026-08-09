import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);

    // Prevent redirecting to login on the server where localStorage is not available
    if (typeof window === 'undefined') {
        return false;
    }

    // Check for window/localStorage availability (SSR safety)
    if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role === 'admin') {
                    return true;
                }

                // Authenticated but not an admin
                router.navigate(['/unauthorized']);
                return false;
            } catch (e) {
                console.error('Error parsing user data in admin guard', e);
            }
        }
    }

    // If not authenticated or not admin, redirect to login
    router.navigate(['/login']);
    return false;
};
