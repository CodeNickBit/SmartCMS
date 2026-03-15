import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const managerHrGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);

    // Prevent redirecting to login on the server where localStorage is not available
    if (typeof window === 'undefined') {
        return false;
    }

    if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                const role = user.role;
                if (role === 'manager' || role === 'hr') {
                    return true;
                }

                // Authenticated but not manager or hr
                router.navigate(['/unauthorized']);
                return false;
            } catch (e) {
                console.error('Error parsing user data in guard', e);
            }
        }
    }

    router.navigate(['/login']);
    return false;
};
