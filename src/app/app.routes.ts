import { Routes } from '@angular/router';
import { Inscription } from './inscription/inscription';
import { Otp } from './otp/otp';
import { Accueil } from './accueil/accueil';

export const routes: Routes = [  
  { path: '', component: Accueil },
  { path: 'inscription', component: Inscription },
  { path: 'otp', component: Otp }
];
