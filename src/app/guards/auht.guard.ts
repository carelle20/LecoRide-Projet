import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Token } from '../services/token'; 

// Garde de route (Guard) pour empêcher l'accès aux pages nécessitant une connexion.

export const AuthGuard: CanActivateFn = (route, state) => {
  // 1. Injecter les services nécessaires
  const tokenService = inject(Token);
  const router = inject(Router);

  // 2. Vérifier l'état de la connexion
  if (tokenService.isLoggedIn()) {
    return true; 
  }

  // 3. Redirection si non connecté
  router.navigate(['/connexion'], { queryParams: { returnUrl: state.url } });
  
  // Bloquer l'accès à la route demandée
  return false; 
};

