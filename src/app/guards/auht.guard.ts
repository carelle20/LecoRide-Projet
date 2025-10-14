import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Token } from '../services/token'; // Service pour vérifier les tokens

/**
 * Garde de route (Guard) pour empêcher l'accès aux pages nécessitant une connexion.
 */
export const AuthGuard: CanActivateFn = (route, state) => {
  // 1. Injecter les services nécessaires
  const tokenService = inject(Token);
  const router = inject(Router);

  // 2. Vérifier l'état de la connexion
  if (tokenService.isLoggedIn()) {
    // L'utilisateur a un Access Token et un Refresh Token (ou du moins, ils existent)
    return true; 
  }

  // 3. Redirection si non connecté
  // L'utilisateur n'est pas connecté. Rediriger vers la page de login.
  router.navigate(['/connexion'], { queryParams: { returnUrl: state.url } });
  
  // Bloquer l'accès à la route demandée
  return false; 
};

/**
 * NOTES DE SÉCURITÉ :
 * 1. Le isLoggedin() de TokenService vérifie uniquement la présence.
 * 2. C'est l'Interceptor (Phase 2) qui gère l'expiration réelle (401) 
 * et force la déconnexion si les tokens sont invalides.
 */