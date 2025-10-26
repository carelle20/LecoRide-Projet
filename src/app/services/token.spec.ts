import { TestBed } from '@angular/core/testing';
import { Token } from './token';

// MOCK DU LOCAL STORAGE
const mockLocalStorage = {
  store: {} as { [key: string]: string },  
  // Implémente localStorage.getItem
  getItem: function(key: string): string | null {
    return this.store[key] || null;
  },  
  // Implémente localStorage.setItem
  setItem: function(key: string, value: string): void {
    this.store[key] = value;
  },
  // Implémente localStorage.removeItem
  removeItem: function(key: string): void {
    delete this.store[key];
  },
  // Implémente localStorage.clear (utile pour la réinitialisation)
  clear: function(): void {
    this.store = {};
  }
};

describe('Token Service', () => {
  let service: Token;
  const ACCESS_TOKEN_KEY = 'access_token';
  const REFRESH_TOKEN_KEY = 'refresh_token';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Token]
    });
    service = TestBed.inject(Token); 
    // Remplacement de l'objet global localStorage par notre mock
    spyOn(localStorage, 'getItem').and.callFake(mockLocalStorage.getItem.bind(mockLocalStorage));
    spyOn(localStorage, 'setItem').and.callFake(mockLocalStorage.setItem.bind(mockLocalStorage));
    spyOn(localStorage, 'removeItem').and.callFake(mockLocalStorage.removeItem.bind(mockLocalStorage));
    mockLocalStorage.clear();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  // 1. Couverture de setTokens
  it('doit stocker le jeton d\'accès et le jeton de rafraîchissement', () => {
    const mockAccess = 'mock_access_token';
    const mockRefresh = 'mock_refresh_token';
    service.setTokens(mockAccess, mockRefresh);
    // Vérifie que les items ont été stockés dans le mock localStorage
    expect(mockLocalStorage.getItem(ACCESS_TOKEN_KEY)).toBe(mockAccess);
    expect(mockLocalStorage.getItem(REFRESH_TOKEN_KEY)).toBe(mockRefresh);
  });

  // 2. Couverture de getAccessToken
  it('doit récupérer le jeton d\'accès', () => {
    const mockAccess = 'mock_access';
    mockLocalStorage.setItem(ACCESS_TOKEN_KEY, mockAccess);
    const token = service.getAccessToken();
    expect(token).toBe(mockAccess);
    expect(localStorage.getItem).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
  });

  it('doit retourner null si le jeton d\'accès n\'existe pas', () => {
    const token = service.getAccessToken();
    expect(token).toBeNull();
  });

  // 3. Couverture de getRefreshToken
  it('doit récupérer le jeton de rafraîchissement', () => {
    const mockRefresh = 'mock_refresh';
    mockLocalStorage.setItem(REFRESH_TOKEN_KEY, mockRefresh);
    const token = service.getRefreshToken();
    expect(token).toBe(mockRefresh);
    expect(localStorage.getItem).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
  });

  it('doit retourner null si le jeton de rafraîchissement n\'existe pas', () => {
    const token = service.getRefreshToken();
    expect(token).toBeNull();
  });
  
  // 4. Couverture de isLoggedIn
  describe('isLoggedIn', () => {
    it('doit retourner true si les deux tokens sont présents (Couverture: true)', () => {
      mockLocalStorage.setItem(ACCESS_TOKEN_KEY, 'a');
      mockLocalStorage.setItem(REFRESH_TOKEN_KEY, 'r');     
      // COUVERTURE : !!a && !!r -> true
      expect(service.isLoggedIn()).toBeTrue(); 
    });

    it('doit retourner false si l\'access token est manquant (Couverture: false)', () => {
      mockLocalStorage.setItem(REFRESH_TOKEN_KEY, 'r');   
      // COUVERTURE : !!null && !!r -> false
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('doit retourner false si le refresh token est manquant (Couverture: false)', () => {
      mockLocalStorage.setItem(ACCESS_TOKEN_KEY, 'a');    
      // COUVERTURE : !!a && !!null -> false
      expect(service.isLoggedIn()).toBeFalse(); 
    });
  });

  // 5. Couverture de clearTokens
  it('doit supprimer les deux tokens du stockage', () => {
    mockLocalStorage.setItem(ACCESS_TOKEN_KEY, 'a');
    mockLocalStorage.setItem(REFRESH_TOKEN_KEY, 'r');
    service.clearTokens();
    expect(mockLocalStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(mockLocalStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
    expect(localStorage.removeItem).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
  });
});