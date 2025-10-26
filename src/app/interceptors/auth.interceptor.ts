import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';
import { Authentification } from '../services/authentification';
import { Token } from '../services/token';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: Authentification,
    private tokenService: Token
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // 1. AJOUTER L'ACCESS TOKEN
    const accessToken = this.tokenService.getAccessToken();
    if (accessToken) {
      request = this.addToken(request, accessToken);
    }
    
    // 2. GÉRER LA RÉPONSE ET L'ERREUR 401
    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          if (this.isRefreshing) {
            // Si on est déjà en rafraîchissement, mettre la requête en attente
            return this.refreshTokenSubject.pipe(
              filter(token => token !== null),
              take(1),
              switchMap((token) => next.handle(this.addToken(request, token)))
            );
          }
          
          return this.handle401Error(request, next);
        }
        
        return throwError(() => error);
      })
    );
  }

  // Méthode utilitaire pour ajouter le token Bearer
  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Logique pour gérer le rafraîchissement
  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    this.isRefreshing = true;
    this.refreshTokenSubject.next(null); 

    // Appel de refresh token
    return this.authService.refreshToken().pipe(
      switchMap((tokens: any) => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(tokens.accessToken);
        
        // Rejouer la requête initiale avec le NOUVEAU token
        return next.handle(this.addToken(request, tokens.accessToken));
      }),
      catchError((err) => {
        // Si le rafraîchissement échoue 
        this.isRefreshing = false;
        this.authService.logout();
        return throwError(() => err);
      }),
      finalize(() => {
        this.isRefreshing = false;
      })
    );
  }
}