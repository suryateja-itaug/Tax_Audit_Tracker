import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { SessionService } from '../admin-services/session.service';

export const sessionGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (sessionService.hasActiveSession()) {
    return true;
  }

  return router.createUrlTree(['/']);
};

export const sessionChildGuard: CanActivateChildFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (sessionService.hasActiveSession()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
