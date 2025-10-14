import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Token {
  private ACCESS_TOKEN_KEY = 'access_token';
  private REFRESH_TOKEN_KEY = 'refresh_token';

  constructor() { }

  /*
   * 1. Stocke les tokens après une connexion ou un rafraîchissement réussi.
   */
  setTokens(accessToken: string, refreshToken: string): void {
    // Stockage du jeton d'accès (Access Token)
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    // Stockage du jeton de rafraîchissement (Refresh Token) - pour la persistance
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * 2. Récupère le jeton d'accès pour l'interceptor HTTP.
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * 3. Récupère le jeton de rafraîchissement pour la requête de renouvellement (401).
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
  
  /**
   * 4. Vérifie si l'utilisateur est potentiellement connecté (pour l'AuthGuard).
   */
  isLoggedIn(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }

  /**
   * 5. Supprime tous les tokens du stockage (Logout).
   */
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}