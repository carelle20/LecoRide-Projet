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
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * 2. Récupère le jeton d'accès pour l'interceptor HTTP.
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * 3. Récupère le jeton de rafraîchissement pour la requête de renouvellement 
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
  
  /**
   * 4. Vérifie si l'utilisateur est potentiellement connecté 
   */
  isLoggedIn(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }

  /**
   * 5. Supprime tous les tokens du stockage 
   */
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}