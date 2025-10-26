import { Routes } from '@angular/router';
import { Inscription } from './inscription/inscription';
import { Otp } from './otp/otp';
import { Accueil } from './accueil/accueil';
import { VerifyEmail } from './verify-email/verify-email';
import { EmailConfirmation } from './email-confirmation/email-confirmation';
import { Onboarding } from './onboarding/onboarding';
import { Connexion } from './connexion/connexion';
import { AuthGuard } from './guards/auht.guard';
import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [ 
  // { path: '', redirectTo: 'accueil', pathMatch: 'full' },
  { path: '', component: Accueil },
  { path: 'connexion', loadComponent: () => import('./connexion/connexion').then(m => m.Connexion) },
  { path: 'inscription', loadComponent: () => import('./inscription/inscription').then(m => m.Inscription) },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [AuthGuard] 
  },
  { path: 'otp', component: Otp },
  { path: 'verify-email', component: VerifyEmail },
  { path: 'email-confirmation', component: EmailConfirmation },
  // { path: 'dashboard', component: Dashboard },
  { path: 'onboarding', component: Onboarding },

];
