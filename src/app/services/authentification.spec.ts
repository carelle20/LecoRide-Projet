import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Authentification } from './authentification';
import { Token } from './token'; 
import { Router } from '@angular/router';
import { of } from 'rxjs';

// Structure simulée de l'utilisateur
const mockUser = {
    id: 1, 
    firstName: 'Test', 
    lastName: 'User', 
    emailPhone: 'test@mail.com', 
    isVerified: true
};

// Structure simulée des tokens 
const mockTokens = { 
    accessToken: 'jwt-access', 
    refreshToken: 'jwt-refresh',
    user: mockUser 
};


describe('AuthentificationService', () => {
  let service: Authentification;
  let httpMock: HttpTestingController;
  let tokenServiceSpy: jasmine.SpyObj<Token>; 
  let routerSpy: jasmine.SpyObj<Router>;
  const apiUrl = 'http://localhost:3000/api/auth'; 

  beforeEach(() => {
    const tokenSpy = jasmine.createSpyObj('Token', ['setTokens', 'clearTokens', 'getRefreshToken', 'getAccessToken', 'isLoggedIn']);
    const rtrSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        Authentification,
        { provide: Token, useValue: tokenSpy }, 
        { provide: Router, useValue: rtrSpy }
      ]
    });

    service = TestBed.inject(Authentification);
    httpMock = TestBed.inject(HttpTestingController);
    tokenServiceSpy = TestBed.inject(Token) as jasmine.SpyObj<Token>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  // TEST 1 : Méthode de Connexion
  it('doit appeler l\'API /connexion, stocker les tokens (avec user) et renvoyer la réponse', () => {
    
    const dummyCredentials = { emailPhone: mockUser.emailPhone, password: 'password' };

    service.login(dummyCredentials.emailPhone, dummyCredentials.password).subscribe(tokens => {
      // Vérification 1: La valeur reçue est correcte et contient le champ 'user'
      expect(tokens).toEqual(mockTokens); 
    });

    // Vérification 2: La requête HTTP est correcte
    const req = httpMock.expectOne(`${apiUrl}/connexion`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dummyCredentials);

    // Simuler la réponse du serveur
    req.flush(mockTokens);

    // Vérification 3: Le TokenService a été appelé pour stocker les tokens
    expect(tokenServiceSpy.setTokens).toHaveBeenCalledWith(mockTokens.accessToken, mockTokens.refreshToken);
  });
  
  // TEST 2 : Méthode de Déconnexion
  it('doit appeler /logout si refresh token existe, nettoyer les tokens et rediriger', () => {
    const refreshToken = 'existing-refresh-token';
    // Préparer l'espion pour simuler l'existence du refresh token
    tokenServiceSpy.getRefreshToken.and.returnValue(refreshToken);

    service.logout();

    // Vérification 1: La requête HTTP /logout est envoyée
    const req = httpMock.expectOne(`${apiUrl}/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: refreshToken });

    // Simuler le succès de l'appel 
    req.flush({ message: 'Déconnexion serveur OK' });
    
    // Vérification 2: Le TokenService a été appelé pour effacer les tokens locaux
    expect(tokenServiceSpy.clearTokens).toHaveBeenCalled();

    // Vérification 3: Redirection vers la page de connexion
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/connexion']);
  });

  // TEST 3 : Méthode de Déconnexion - Pas de Refresh Token
  it('doit uniquement nettoyer les tokens locaux et rediriger si le refresh token est absent', () => {
    // Préparer l'espion pour simuler l'absence du refresh token
    tokenServiceSpy.getRefreshToken.and.returnValue(null);

    service.logout();

    // Vérification 1: AUCUNE requête HTTP /logout n'est envoyée
    httpMock.expectNone(`${apiUrl}/logout`);
    
    // Vérification 2: Le TokenService a été appelé pour effacer les tokens locaux
    expect(tokenServiceSpy.clearTokens).toHaveBeenCalled();

    // Vérification 3: Redirection vers la page de connexion
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/connexion']);
  });

  // TEST 4 : Récupération du jeton d'accès
  it('doit récupérer le jeton d\'accès via le TokenService', () => {
    const mockAccessToken = 'mocked-access-token';
    tokenServiceSpy.getAccessToken.and.returnValue(mockAccessToken);
    
    expect(service.getAccessToken()).toBe(mockAccessToken);
    expect(tokenServiceSpy.getAccessToken).toHaveBeenCalled();
  });

  // TEST 5 : Couverture de sendOtp
  it('doit appeler l\'API /send-otp en POST avec le numéro de téléphone', () => {
      const phone = '+237677001122';
      
      service.sendOtp(phone).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/send-otp`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ phone: phone });
      
      req.flush({ success: true, message: 'OTP sent' });
  });

  // TEST 6 : Couverture de verifyOtp
  it('doit appeler l\'API /verify-otp en POST avec le téléphone et l\'OTP', () => {
      const phone = '+237677001122';
      const otp = '654321';
      
      service.verifyOtp(phone, otp).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/verify-otp`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ phone: phone, otp: otp });
      
      req.flush({ success: true, message: 'OTP verified' });
  });

  // TEST 7 : Couverture de registerUser
  it('doit appeler l\'API /register en POST avec les données d\'inscription', () => {
      const registrationData = { name: 'Alice', phone: '699112233', password: 'password123' };
      
      service.registerUser(registrationData as any).subscribe();
      
      const req = httpMock.expectOne(`${apiUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registrationData);
      
      req.flush({ success: true });
  });

  // TEST 8 : Couverture de la branche d'erreur de logout()
  it('doit gérer l\'erreur de déconnexion serveur et continuer la déconnexion locale', () => {
      const refreshToken = 'existing-refresh-token';
      tokenServiceSpy.getRefreshToken.and.returnValue(refreshToken);
      
      // Espion sur console.warn pour vérifier que le message est bien émis
      spyOn(console, 'warn'); 
      service.logout();
      // 1. La requête HTTP est envoyée 
      const req = httpMock.expectOne(`${apiUrl}/logout`);
      expect(req.request.method).toBe('POST');
      // 2. Simuler une ERREUR de l'appel
      req.error(new ErrorEvent('Network error'), { status: 500, statusText: 'Server Error' });  
      // 3. Vérification de l'avertissement dans la console
      expect(console.warn).toHaveBeenCalled(); 
      // 4. Vérification que la déconnexion locale continue
      expect(tokenServiceSpy.clearTokens).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/connexion']);
  });

  // TEST 9 : Couverture de getIsLoggedIn()
  it('doit relayer le statut de connexion du TokenService', () => {
      tokenServiceSpy.isLoggedIn.and.returnValue(true);
      expect(service.getIsLoggedIn()).toBeTrue();
      expect(tokenServiceSpy.isLoggedIn).toHaveBeenCalled();

      tokenServiceSpy.isLoggedIn.and.returnValue(false);
      expect(service.getIsLoggedIn()).toBeFalse();
  });

  // TEST 10 : Couverture de refreshToken() - Cas de Succès
  it('doit appeler /refresh avec le refresh token, stocker les nouveaux tokens, et renvoyer la réponse', () => {
      const refreshToken = 'old-refresh-token';
      const newTokens = { accessToken: 'new-access', refreshToken: 'new-refresh', user: mockUser };      
      tokenServiceSpy.getRefreshToken.and.returnValue(refreshToken);
      service.refreshToken().subscribe(tokens => {
          expect(tokens).toEqual(newTokens as any); 
      });
      // COUVERTURE : Appel HTTP /refresh
      const req = httpMock.expectOne(`${apiUrl}/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: refreshToken });
      
      req.flush(newTokens);
      expect(tokenServiceSpy.setTokens).toHaveBeenCalledWith(newTokens.accessToken, newTokens.refreshToken);
  });

  // TEST 11 : Couverture de refreshToken() - Cas d'Erreur (Token Manquant)
  it('doit retourner une erreur si le refresh token est manquant (if (!refreshToken))', (done) => {
      tokenServiceSpy.getRefreshToken.and.returnValue(null);
      service.refreshToken().subscribe({
          next: () => fail('L\'appel aurait dû échouer'),
          error: (error) => {
              expect(error).toBe('Refresh Token missing');
              done();
          }
      });  
      httpMock.expectNone(`${apiUrl}/refresh`); 
  });
});