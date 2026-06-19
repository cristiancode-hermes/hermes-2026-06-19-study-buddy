import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">Settings</h1>

      <div class="space-y-6">
        <!-- Profile Section -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile</h2>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                formControlName="name"
                placeholder="Your name"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                formControlName="email"
                readonly
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              [disabled]="profileForm.invalid"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </form>
        </div>

        <!-- Appearance -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Toggle dark mode for the UI</p>
            </div>
            <button
              (click)="themeService.toggle()"
              class="relative w-11 h-6 rounded-full transition-colors"
              [class]="themeService.isDark() ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'"
            >
              <div
                class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                [class]="themeService.isDark() ? 'translate-x-5.5' : 'translate-x-0.5'"
              ></div>
            </button>
          </div>
        </div>

        <!-- Account Actions -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Account</h2>
          <div class="space-y-3">
            <button
              (click)="logout()"
              class="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>

            <!-- Danger Zone -->
            <div class="border-t border-red-200 dark:border-red-900 pt-3 mt-3">
              <p class="text-sm font-medium text-red-600 dark:text-red-400 mb-3">Danger Zone</p>
              <button
                (click)="showDeleteConfirm.set(true)"
                class="w-full px-4 py-2.5 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800 transition-colors"
              >
                Delete Account
              </button>
              @if (showDeleteConfirm()) {
                <div class="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p class="text-sm text-red-700 dark:text-red-300 mb-4">
                    Are you sure? This will permanently delete your account and all data. This cannot be undone.
                  </p>
                  <div class="flex gap-3">
                    <button (click)="showDeleteConfirm.set(false)" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      Cancel
                    </button>
                    <button (click)="deleteAccount()" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">
                      Delete Forever
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsPageComponent {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly showDeleteConfirm = signal(false);

  protected readonly profileForm = this.fb.group({
    name: [''],
    email: [''],
  });

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.profileForm.patchValue({
        name: user.name || '',
        email: user.email,
      });
    }
  }

  saveProfile(): void {
    const { name } = this.profileForm.value;
    firstValueFrom(this.api.put<{ name: string }>('/auth/profile', { name }))
      .then((res) => {
        this.toast.show('Profile updated!', 'success');
        this.authService.user.update((u) => u ? { ...u, name: res.name } : u);
      })
      .catch((err) => {
        this.toast.show(err.error?.message || 'Failed to update profile', 'error');
      });
  }

  logout(): void {
    this.authService.logout();
  }

  deleteAccount(): void {
    firstValueFrom(this.api.delete<void>('/auth/account'))
      .then(() => {
        this.toast.show('Account deleted.', 'info');
        this.authService.logout();
      })
      .catch((err) => {
        this.toast.show(err.error?.message || 'Failed to delete account', 'error');
      });
  }
}
