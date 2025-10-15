import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment'; 
import { Token } from './token';
import { Router } from '@angular/router';
import { UserProfile } from '../models/user.model'; 

//Interface pour les AuthTokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserProfile; 
}

//Interface pour la réponse des appels d'OTP
interface OtpResponse {
    success: boolean;
    message: string;
    phone?: string; 
}

//Interface pour les données de l'utilisateur à enregistrer
interface RegistrationData {
    name: string;
    phone: string;
    password: string;
}

@Injectable({
  providedIn: 'root'
})
export class Authentification {
  // private apiUrl = 'http://localhost:3000/api/auth';
  private apiUrl = environment.apiUrl + '/auth';

  constructor(
    private http: HttpClient, 
    private tokenService: Token, 
    private router: Router
  ) {}

  sendOtp(phone: string): Observable<OtpResponse> {
    return this.http.post<OtpResponse>(`${this.apiUrl}/send-otp`, { phone });
  }

  verifyOtp(phone: string, otp: string): Observable<OtpResponse> {
    return this.http.post<OtpResponse>(`${this.apiUrl}/verify-otp`, { phone, otp });
  }

  registerUser(data: RegistrationData) {
    return this.http.post<OtpResponse>(`${this.apiUrl}/register`, data); 
  }

  login(emailPhone: string, password: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.apiUrl}/connexion`, { emailPhone, password }).pipe(
      tap(tokens => {
        this.tokenService.setTokens(tokens.accessToken, tokens.refreshToken);
      })
    );
  }
  
  logout(): void {
      const refreshToken = this.tokenService.getRefreshToken();
      
      if (refreshToken) {
          this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe({
              next: () => console.log('Déconnexion serveur réussie.'),
              error: (err) => console.warn('Erreur lors de la déconnexion serveur (continue la déconnexion locale).', err)
          });
      }

      this.tokenService.clearTokens(); 
      this.router.navigate(['/connexion']); 
  }

  public getIsLoggedIn(): boolean {
    return this.tokenService.isLoggedIn();
  }
  
//Renouvellement du token 
  refreshToken(): Observable<AuthTokens> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      // Si le refresh token est manquant, l'utilisateur n'est pas loggué
      return new Observable<AuthTokens>(observer => observer.error('Refresh Token missing'));
    }
    
    //Point d'API pour rafraîchir le token
    return this.http.post<AuthTokens>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
        tap(tokens => {
            this.tokenService.setTokens(tokens.accessToken, tokens.refreshToken);
        })
    );
  }

  // Méthode utilitaire pour l'Interceptor
  public getAccessToken(): string | null {
    //Utilisation du service Token
    return this.tokenService.getAccessToken();
  }

}
