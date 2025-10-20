import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { VerifyEmail } from './verify-email'; 
import { Verify } from '../services/verify'; 
import { Tracking } from '../services/tracking'; 
import { CommonModule } from '@angular/common';
import { ToastrModule, ToastrService } from 'ngx-toastr';

const mockVerifyService = {
  verifyEmail: jasmine.createSpy('verifyEmail'),
  resendEmailLink: jasmine.createSpy('resendEmailLink'),
};

const mockRouter = {
  navigate: jasmine.createSpy('navigate'),
};

const mockTrackingService = {
  track: jasmine.createSpy('track'),
};

const mockActivatedRoute = {
  queryParams: of({
    token: 'valid-test-token',
    email: 'test@example.com'
  }),

  snapshot: {
    queryParams: {
      token: 'valid-test-token',
      email: 'test@example.com'
    }
  }
};


describe('VerifyEmail Component', () => {
  let component: VerifyEmail;
  let fixture: ComponentFixture<VerifyEmail>;

  beforeEach(async () => {
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'warning']); 
    await TestBed.configureTestingModule({
      imports: [VerifyEmail, 
        CommonModule, 
        HttpClientTestingModule, 
        RouterTestingModule,
        HttpClientTestingModule, 
        ToastrModule.forRoot()
      ],
      providers: [
        { provide: Verify, useValue: mockVerifyService },
        { provide: Router, useValue: mockRouter },
        { provide: Tracking, useValue: mockTrackingService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ToastrService, useValue: toastrServiceSpy } 
      ]
    }).compileComponents();
    
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;
    mockVerifyService.verifyEmail.calls.reset();
    mockVerifyService.resendEmailLink.calls.reset();
    mockRouter.navigate.calls.reset();
    mockTrackingService.track.calls.reset();
    
    fixture.detectChanges();
  });

  afterEach(() => {
  });


  it('devrait appeler le service de vérification au démarrage et mettre success à true en cas de succès', fakeAsync(() => {
    component.token = 'valid-test-token';
    component.email = 'test@example.com';

    mockVerifyService.verifyEmail.and.returnValue(of({ success: true, message: 'Vérifié' }));

    component['callVerificationApi'](); // on déclenche la vérification
    tick();

    expect(mockVerifyService.verifyEmail).toHaveBeenCalledWith('valid-test-token', 'test@example.com');
    expect(component.isVerifying).toBe(false);
    expect(component.success).toBe(true);
    expect(component.expired).toBe(false);

  }));


  it('devrait gérer l\'expiration (403) et afficher le bouton de renvoi', fakeAsync(() => {
    const errorResponse = {
        status: 403, 
        error: { message: 'Le lien a expiré.' } 
    };

    // Préparer les paramètres nécessaires
    component.token = 'valid-token';
    component.email = 'test@example.com';

    // Simuler l'erreur 403
    mockVerifyService.verifyEmail.and.returnValue(throwError(() => errorResponse));

    // Déclencher la vérification
    component['callVerificationApi']();
    tick();

    // Vérifications
    expect(component.expired).toBe(true); 
    expect(component.message).toContain('expiré');
    expect(mockTrackingService.track).toHaveBeenCalledWith('EmailVerify_Failed_Expired', jasmine.anything());
  }));



  it('devrait gérer le token invalide (401) sans activer l\'expiration', fakeAsync(() => {
    // Simuler les params query de l'URL
    component.token = 'fake-token';
    component.email = 'test@example.com';

    // Simuler l'appel du service qui renvoie une erreur 401
    mockVerifyService.verifyEmail.and.returnValue(throwError(() => ({ 
      status: 401, 
      error: { success: false, message: 'Token invalide.' } 
    })));

    // Appel manuel de la fonction qui déclenche la vérification
    component['callVerificationApi'](); 

    // Avancer le temps pour exécuter le subscribe
    tick();

    expect(component.success).toBe(false);
    expect(component.expired).toBe(false);
    expect(component.message).toContain('invalide');
  }));


  //Renvoi du lien

  it('devrait appeler le service de renvoi et afficher un message de succès', fakeAsync(() => {
    component.expired = true;
    component.email = 'test@example.com';
    fixture.detectChanges();

    mockVerifyService.resendEmailLink.and.returnValue(of({ success: true, message: 'Nouveau lien envoyé.' }));

    component.resendLink();
    expect(mockTrackingService.track).toHaveBeenCalledWith('EmailResend_Clicked', jasmine.anything());
    
    tick(); 

    expect(mockVerifyService.resendEmailLink).toHaveBeenCalledWith('test@example.com');
    expect(component.message).toContain('Nouveau lien envoyé.');
    expect(component.expired).toBe(false); 
    expect(mockTrackingService.track).toHaveBeenCalledWith('EmailResend_Succeeded', jasmine.anything());
  }));
});