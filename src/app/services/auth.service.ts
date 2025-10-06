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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseApiUrl: string = environment.baseApiUrl;
  loginApiUrl: string = `${this.baseApiUrl}/User/Login`;
  private tokenKey = 'auth_token';

  private currentUserSubject = new BehaviorSubject<UserBasicInfo | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserIfTokenValid();
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

  public loadUserIfTokenValid(): void {
    this.getUserProfile()
      .pipe(
        catchError((err) => {
          this.currentUserSubject.next(null);
          return of(null);
        })
      )
      .subscribe((user) => {
        if (user) {
          this.currentUserSubject.next(user);
        }
      });
  }

  getUserProfile(): Observable<UserBasicInfo> {
    return this.http.get<UserBasicInfo>(`${this.baseApiUrl}/User/`);
  }
}
