import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private publicRoutes = ['/login', '/signup', '/'];
  private isRefreshing = false;
  private authService!: AuthService;

  constructor(private router: Router, private injector: Injector) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = sessionStorage.getItem('auth_token');

    let authReq = req;
    if (token && req.url.indexOf('User/Refresh') === -1) {
      authReq = this.addToken(req, token);
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.isRefreshing) {
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;

      if (!this.authService) {
        this.authService = this.injector.get(AuthService);
      }

      return this.authService.refreshToken().pipe(
        switchMap((newToken: string) => {
          this.isRefreshing = false;
          return next.handle(this.addToken(request, newToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          const currentRoute = this.router.url.split('?')[0];
          const isPublicRoute = this.publicRoutes.includes(currentRoute);
          if (!isPublicRoute) {
            this.authService.logout().subscribe();
            this.router.navigate(['/login']);
          }
          return throwError(() => err);
        })
      );
    }
    return throwError(() => new Error('Refresh already in progress.'));
  }
}
