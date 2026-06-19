import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { signal, computed } from '@angular/core';
import { User } from '../models/interfaces';

export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly user = signal<User | null>(null);
  readonly token = signal<string | null>(localStorage.getItem('study-buddy-token'));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly isAuthenticated = computed(() => this.token() !== null);

  login(email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    return new Promise((resolve, reject) => {
      this.http.post<{ token: string; user: User }>('http://localhost:3000/api/auth/login', { email, password }).subscribe({
        next: (res) => {
          localStorage.setItem('study-buddy-token', res.token);
          this.token.set(res.token);
          this.user.set(res.user);
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
          resolve();
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err.error?.message || err.message || 'Login failed';
          this.error.set(msg);
          reject(new Error(msg));
        },
      });
    });
  }

  register(email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    return new Promise((resolve, reject) => {
      this.http.post<{ token: string; user: User }>('http://localhost:3000/api/auth/register', { email, password }).subscribe({
        next: (res) => {
          localStorage.setItem('study-buddy-token', res.token);
          this.token.set(res.token);
          this.user.set(res.user);
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
          resolve();
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err.error?.message || err.message || 'Registration failed';
          this.error.set(msg);
          reject(new Error(msg));
        },
      });
    });
  }

  logout(): void {
    localStorage.removeItem('study-buddy-token');
    this.token.set(null);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  getProfile(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<User>('http://localhost:3000/api/auth/profile').subscribe({
        next: (user) => {
          this.user.set(user);
          resolve();
        },
        error: (err) => {
          if (err.status === 401) {
            this.logout();
          }
          reject(err);
        },
      });
    });
  }
}
