import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  baseApiUrl: string = environment.baseApiUrl;
  constructor(private http: HttpClient) {}

  signup(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseApiUrl}User/CreateUser`, {
      username,
      email,
      password,
    });
  }
}
