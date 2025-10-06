import { Routes } from '@angular/router';
import { Inscription } from './inscription/inscription';
import { Otp } from './otp/otp';
import { Accueil } from './accueil/accueil';
import { VerifyEmail } from './verify-email/verify-email';
import { EmailConfirmation } from './email-confirmation/email-confirmation';
import { Onboarding } from './onboarding/onboarding';

export const routes: Routes = [  
  { path: '', component: Accueil },
  { path: 'inscription', component: Inscription },
  { path: 'otp', component: Otp },
  { path: 'verify-email', component: VerifyEmail },
  { path: 'email-confirmation', component: EmailConfirmation },
  { path: 'onboarding', component: Onboarding },

];
