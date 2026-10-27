import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { NotificationService } from '../services/notification';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notifications = inject(NotificationService);

  if (await auth.isLoggedIn()) {
    return true;
  }

  notifications.info('Log in to access this page.');
  return router.createUrlTree(['/login']);
};