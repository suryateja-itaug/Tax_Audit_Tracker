import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../admin-services/session.service';

export const adminOnlyGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (sessionService.canManageUsers()) {
    return true;
  }

  return router.createUrlTree(['/admin/dashboard']);
};
