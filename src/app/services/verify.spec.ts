import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Verify } from './verify';

describe('Verify Service', () => {
  let service: Verify;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api/auth';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Verify]
    });
    
    service = TestBed.inject(Verify);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // S'assure qu'aucune requête HTTP non mockée n'est en attente
    httpMock.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  // 1. Couverture de verifyOtp(otp, phone)
  it('doit envoyer une requête POST correcte pour la vérification OTP', () => {
    const mockOtp = '123456';
    const mockPhone = '+237677112233';
    let response: any;
    
    // Appel du service
    service.verifyOtp(mockOtp, mockPhone).subscribe(res => {
        response = res;
    });

    // Interception de la requête
    const req = httpMock.expectOne(`${apiUrl}/verify/otp`);

    // Vérification de la méthode et du corps
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ otp: mockOtp, phone: mockPhone });
    
    // Simulation de la réponse
    const mockResponse = { success: true };
    req.flush(mockResponse);

    expect(response).toEqual(mockResponse);
  });

  // 2. Couverture de resendOtp(phone)
  it('doit envoyer une requête POST correcte pour le renvoi de l\'OTP', () => {
    const mockPhone = '+237677112233';
    
    service.resendOtp(mockPhone).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/verify/resend-otp`);
    
    // Vérification de la méthode et du corps
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ phone: mockPhone });

    req.flush({}); // Réponse vide
  });

  // 3. Couverture de verifyEmail(token, email)
  it('doit envoyer une requête GET correcte pour la vérification d\'email (avec query params)', () => {
    const mockToken = 'mock-email-token-xyz';
    const mockEmail = 'user@test.com';
    
    service.verifyEmail(mockToken, mockEmail).subscribe();

    // L'URL attendue doit inclure les query parameters exacts
    const expectedUrl = `${apiUrl}/verify/email?token=${mockToken}&email=${mockEmail}`;
    const req = httpMock.expectOne(expectedUrl);
    
    // Vérification de la méthode
    expect(req.request.method).toBe('GET');

    req.flush({}); // Réponse vide
  });

  // 4. Couverture de resendEmailLink(email)
  it('doit envoyer une requête POST correcte pour le renvoi du lien d\'email', () => {
    const mockEmail = 'user@test.com';
    
    service.resendEmailLink(mockEmail).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/verify/resend-email`);
    
    // Vérification de la méthode et du corps
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: mockEmail });

    req.flush({}); // Réponse vide
  });
});