import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private baseUrl = 'http://localhost:3000/api';

  private headers(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = this.auth.token();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { headers: this.headers() });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, { headers: this.headers() });
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body, { headers: this.headers() });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`, { headers: this.headers() });
  }
}
