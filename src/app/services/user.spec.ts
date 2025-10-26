import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { User } from './user';
import { InscriptionForm } from '../models/inscription-form.model';
import { delay } from 'rxjs';

// Définition de la structure de réponse attendue
interface RegisterResponse {
  success: boolean;
  type: 'phone' | 'email';
  message: string;
  phone?: string;
  email?: string;
}

describe('User Service', () => {
  let service: User;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api/auth';
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], 
      providers: [User]
    });
    
    service = TestBed.inject(User);
    httpMock = TestBed.inject(HttpTestingController); 
    // Ajout d'un spy sur console.log pour éviter l'affichage dans les logs de test
    spyOn(console, 'log'); 
  });

  afterEach(() => {
    // S'assure qu'aucune requête HTTP non mockée n'est en attente
    httpMock.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  // 1. Couverture de checkAvailability (Logique interne)

  describe('checkAvailability', () => {
    
    it('doit retourner true si la valeur est disponible', fakeAsync(() => {
      let isAvailable: boolean | undefined;
      const availableValue = 'new@user.com';
      
      service.checkAvailability(availableValue).subscribe(result => {
        isAvailable = result;
      });
      
      // Simule l'écoulement du temps pour l'opérateur delay(50)
      tick(50);
      
      // COUVERTURE du cas 'disponible'
      expect(isAvailable).toBeTrue();
      expect(console.log).toHaveBeenCalledWith('Checking availability for:', availableValue);
    }));

    it('doit retourner false si la valeur est indisponible', fakeAsync(() => {
      let isAvailable: boolean | undefined;
      const unavailableEmail = 'test@used.com'; 
      
      service.checkAvailability(unavailableEmail).subscribe(result => {
        isAvailable = result;
      });
      tick(50);
      
      // COUVERTURE du cas 'indisponible'
      expect(isAvailable).toBeFalse();
    }));
  });

  // 2. Couverture de register
  it('doit effectuer un appel POST pour l\'enregistrement de l\'utilisateur', () => {
    const mockUserData: InscriptionForm = {
      firstName: 'Test',
      lastName: 'User',
      emailPhone: 'test@example.com',
      password: 'password123!',
      consent: true,
    };   
    const mockResponse: RegisterResponse = {
      success: true,
      type: 'email',
      message: 'User registered successfully',
      email: mockUserData.emailPhone
    };
    let actualResponse: RegisterResponse | undefined;
    service.register(mockUserData).subscribe(response => {
      actualResponse = response;
    });

    // 1. Intercepte la requête HTTP
    const req = httpMock.expectOne(`${apiUrl}/register`);

    // 2. Vérifie que c'est une méthode POST et que le corps est correct
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockUserData);
    expect(console.log).toHaveBeenCalledWith('Attempting to register user via API:', mockUserData);

    // 3. Simule la réponse de l'API
    req.flush(mockResponse);

    // 4. Vérifie la réponse du service
    expect(actualResponse).toEqual(mockResponse);
  });
});