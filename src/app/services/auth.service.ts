import { SignupRequest } from './../interfaces/SignupRequest';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment.development';
import {
  tap,
  Observable,
  BehaviorSubject,
  catchError,
  of,
  switchMap,
  throwError,
  map,
  finalize,
} from 'rxjs';
import { UserBasicInfo } from '../interfaces/UserBasicInfo';
import { LoginRequest } from '../interfaces/LoginRequest';
import { LoginResponse } from '../interfaces/LoginResponse';
import { jwtDecode } from 'jwt-decode';
import { ChangePasswordRequest } from '../interfaces/ChangePasswordRequest';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseApiUrl: string = environment.baseApiUrl;
  private tokenKey = 'auth_token';

  private currentUserSubject = new BehaviorSubject<UserBasicInfo | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private populationDone = new BehaviorSubject<boolean>(false);
  isPopulationDone$ = this.populationDone.asObservable();

  constructor(private http: HttpClient) {}

  public populate(): void {
    this.getUserProfile()
      .pipe(
        catchError(() => {
          this.currentUserSubject.next(null);
          return of(null);
        }),
        finalize(() => {
          this.populationDone.next(true);
        })
      )
      .subscribe((user) => {
        this.currentUserSubject.next(user);
      });
  }

  login(credentials: LoginRequest): Observable<UserBasicInfo | null> {
    return this.http
      .post<LoginResponse>(`${this.baseApiUrl}/User/Login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => this.saveToken(response.token)),
        switchMap(() => this.getUserProfile()),
        tap((user) => this.currentUserSubject.next(user)),
        catchError((err) => {
          this.currentUserSubject.next(null);
          return throwError(() => err);
        })
      );
  }

  public logout(): Observable<any> {
    return this.http
      .post(`${this.baseApiUrl}/User/Logout`, {}, { withCredentials: true })
      .pipe(
        finalize(() => {
          this.removeToken();
          this.currentUserSubject.next(null);
        })
      );
  }

  signup(signupRequest: SignupRequest): Observable<any> {
    return this.http.post(`${this.baseApiUrl}/User/CreateUser`, signupRequest);
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.baseApiUrl}/User/SendPasswordReset`, {
      email,
    });
  }

  resetPassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.baseApiUrl}/User/ChangePassword`, request);
  }

  public refreshToken(): Observable<string> {
    return this.http
      .post<{ token: string }>(
        `${this.baseApiUrl}/User/Refresh`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap((response) => this.saveToken(response.token)),
        map((response) => response.token),
        catchError((err) => {
          this.currentUserSubject.next(null);
          return throwError(() => err);
        })
      );
  }

  private getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  private removeToken(): void {
    sessionStorage.removeItem(this.tokenKey);
  }

  private saveToken(token: string): void {
    sessionStorage.setItem(this.tokenKey, token);
  }

  getUserProfile(): Observable<UserBasicInfo> {
    return this.http.get<UserBasicInfo>(`${this.baseApiUrl}/User/`);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  private isTokenExpired(token?: string): boolean {
    if (!token) token = this.getToken() ?? undefined;
    if (!token) return true;

    try {
      const decoded: any = jwtDecode(token);
      if (typeof decoded.exp === 'undefined') return true;
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch {
      return true;
    }
  }

  checkAuthentication(): Observable<boolean> {
    // if (this.isLoggedIn()) {
    //   return of(true);
    // }
    return this.getUserProfile().pipe(
      map((user) => {
        this.currentUserSubject.next(user);
        return true;
      }),
      catchError((err) => {
        this.currentUserSubject.next(null);
        return of(false);
      })
    );
  }
}
