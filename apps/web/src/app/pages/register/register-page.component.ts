import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SpinnerComponent } from '../../components/spinner/spinner.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SpinnerComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-950 dark:to-gray-900 px-4">
      <div class="w-full max-w-md">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          <!-- Logo -->
          <div class="flex items-center justify-center gap-2 mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600 dark:text-primary-400"><path d="M22 10v6M2 10l10-5 10 5-10 5Z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Study Buddy</h1>
          </div>

          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">Create your account</h2>

          @if (authService.error()) {
            <div class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
              {{ authService.error() }}
            </div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="you@example.com"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                placeholder="At least 6 characters"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                placeholder="Repeat your password"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
              />
            </div>

            @if (passwordMismatch()) {
              <p class="text-sm text-red-600 dark:text-red-400">Passwords do not match.</p>
            }

            <button
              type="submit"
              [disabled]="registerForm.invalid || authService.loading()"
              class="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              @if (authService.loading()) {
                <app-spinner size="sm" />
                Creating account...
              } @else {
                Create account
              }
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?
            <a routerLink="/login" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterPageComponent {
  protected readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  protected readonly passwordMismatch = signal(false);

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    const { email, password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.passwordMismatch.set(true);
      return;
    }
    this.passwordMismatch.set(false);
    this.authService.register(email!, password!);
  }
}
