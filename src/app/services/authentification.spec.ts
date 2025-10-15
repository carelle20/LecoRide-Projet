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

  // TEST 1 : Méthode de Connexion (login)
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
  
  // TEST 2 : Méthode de Déconnexion (logout)
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

  // TEST 3 : Méthode de Déconnexion (logout) - Pas de Refresh Token
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
});