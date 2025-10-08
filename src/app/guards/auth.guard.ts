import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { tap, filter, take, switchMap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isPopulationDone$.pipe(
    filter((done) => done),
    take(1),
    switchMap(() => authService.checkAuthentication()),
    tap((isAuthenticated) => {
      if (!isAuthenticated) {
        router.navigate(['/login']);
      }
    })
  );
};
