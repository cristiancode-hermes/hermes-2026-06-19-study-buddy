import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login-page.component').then(m => m.LoginPageComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register-page.component').then(m => m.RegisterPageComponent) },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard-page.component').then(m => m.DashboardPageComponent), canActivate: [authGuard] },
  { path: 'dashboard/decks/:id', loadComponent: () => import('./pages/deck-detail/deck-detail-page.component').then(m => m.DeckDetailPageComponent), canActivate: [authGuard] },
  { path: 'study/:deckId', loadComponent: () => import('./pages/study/study-page.component').then(m => m.StudyPageComponent), canActivate: [authGuard] },
  { path: 'ai-generate', loadComponent: () => import('./pages/ai-generate/ai-generate-page.component').then(m => m.AiGeneratePageComponent), canActivate: [authGuard] },
  { path: 'ai-generate/:deckId', loadComponent: () => import('./pages/ai-generate/ai-generate-page.component').then(m => m.AiGeneratePageComponent), canActivate: [authGuard] },
  { path: 'quiz/:deckId', loadComponent: () => import('./pages/quiz/quiz-page.component').then(m => m.QuizPageComponent), canActivate: [authGuard] },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings-page.component').then(m => m.SettingsPageComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '/dashboard' },
];
