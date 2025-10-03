import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of, take, tap } from 'rxjs';
import { UserBasicInfo } from '../interfaces/UserBasicInfo';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseApiUrl: string = environment.baseApiUrl;
  private tokenKey = 'auth_token';
  private currentUserSubject = new BehaviorSubject<UserBasicInfo | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserIfTokenValid();
  }

  public loadUserIfTokenValid(): void {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      this.currentUserSubject.next(null);
      return;
    }

    this.getUserProfile()
      .pipe(
        take(1),
        catchError(() => {
          this.logout();
          return of(null as UserBasicInfo | null);
        }),
        tap((user) => this.currentUserSubject.next(user ?? null))
      )
      .subscribe();
  }

  getUserProfile(): Observable<UserBasicInfo> {
    return this.http.get<UserBasicInfo>(`${this.baseApiUrl}/User/`);
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

  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  signup(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseApiUrl}/User/CreateUser`, {
      username,
      email,
      password,
    });
  }

  logout(): void {
    this.removeToken();
    this.currentUserSubject.next(null);
  }
}
