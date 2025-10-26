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

const mockActivatedRouteNoParams = {
    queryParams: of({}), // Observable qui émet un objet vide
    snapshot: { queryParams: {} }
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
  let toastrServiceSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    toastrServiceSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'warning', 'info']); 
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

  // Renvoi du lien
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

  // 5. Couverture de ngOnInit 
  it('doit échouer l\'initialisation si le token ou l\'email sont manquants dans l\'URL', async () => {
      // 1. Réinitialiser l'environnement de test. 
      TestBed.resetTestingModule(); 
      
      // 2. Reconfigurer l'environnement iniquement pour ce test 
      await TestBed.configureTestingModule({
          imports: [
              VerifyEmail, 
              CommonModule, 
              HttpClientTestingModule, 
              RouterTestingModule, 
              ToastrModule.forRoot()
          ],
          providers: [
              { provide: ActivatedRoute, useValue: mockActivatedRouteNoParams }, 
              { provide: Verify, useValue: mockVerifyService },
              { provide: Router, useValue: mockRouter },
              { provide: Tracking, useValue: mockTrackingService },
              { provide: ToastrService, useValue: toastrServiceSpy }
          ]
      }).compileComponents();
      
      // 3. Créer le composant avec la nouvelle configuration
      const fixtureNoParams = TestBed.createComponent(VerifyEmail);
      const componentNoParams = fixtureNoParams.componentInstance;
      
      // Déclenche ngOnInit qui prend la route vide
      fixtureNoParams.detectChanges(); 
      
      // Vérifications
      expect(componentNoParams.isVerifying).toBe(false);
      expect(componentNoParams.expired).toBe(true); 
      expect(componentNoParams.message).toBe("Lien de vérification invalide ou incomplet.");
      expect(toastrServiceSpy.error).toHaveBeenCalled();
      
      // 4. Réinitialiser à nouveau l'environnement pour le `beforeEach` suivant.
      TestBed.resetTestingModule(); 
  });

  // 6. Couverture de callVerificationApi
  it('ne doit pas appeler le service si le token ou l\'email sont nulls (retours anticipés)', () => {
      // S'assurer que le service n'a pas été appelé par ngOnInit
      mockVerifyService.verifyEmail.calls.reset(); 
      
      // CAS 1 : Token manquant
      component.token = null;
      component.email = 'test@example.com';
      
      component['callVerificationApi']();
      
      // COUVERTURE
      expect(mockVerifyService.verifyEmail).not.toHaveBeenCalled();
      mockVerifyService.verifyEmail.calls.reset(); 
      
      // CAS 2 : Email manquant
      component.token = 'valid-token';
      component.email = null;
      component['callVerificationApi']();
      
      expect(mockVerifyService.verifyEmail).not.toHaveBeenCalled();
  });

  // 7. Couverture de callVerificationApi
  it('doit gérer l\'erreur de vérification serveur sans message API (Message par défaut)', fakeAsync(() => {
      component.token = 'valid-token';
      component.email = 'test@example.com';
      
      // Simuler l'appel du service qui renvoie une erreur sans corps 'error.message'
      mockVerifyService.verifyEmail.and.returnValue(throwError(() => ({ 
          status: 500, 
          error: {} // Corps vide
      })));

      component['callVerificationApi'](); 
      tick();
      expect(component.success).toBe(false);
      expect(component.expired).toBe(false);
      expect(component.message).toBe("Une erreur est survenue.");
      expect(mockTrackingService.track).toHaveBeenCalledWith('EmailVerify_Failed_Generic', jasmine.anything());
      expect(toastrServiceSpy.error).toHaveBeenCalledWith("Une erreur est survenue.");
  }));

// 8. Couverture de resendLink()
it('ne doit pas appeler le service de renvoi si l\'email est null (retour anticipé)', () => {
    component.email = null;
    
    component.resendLink();
    
    // COUVERTURE : if (!this.email) return;
    expect(mockVerifyService.resendEmailLink).not.toHaveBeenCalled();
});

it('doit gérer l\'erreur de renvoi de lien (resendLink error)', fakeAsync(() => {
    component.email = 'test@example.com';
    
    // Simuler l'erreur
    mockVerifyService.resendEmailLink.and.returnValue(throwError(() => ({ 
        status: 429, 
        error: { message: 'Trop de requêtes.' } 
    })));
    
    component.resendLink();
    tick();

    expect(component.isVerifying).toBe(false);
    expect(component.expired).toBe(true);
    expect(component.message).toBe('Trop de requêtes.');
    expect(toastrServiceSpy.error).toHaveBeenCalledWith('Trop de requêtes.');
    expect(mockTrackingService.track).toHaveBeenCalledWith('EmailResend_Failed', jasmine.anything());
}));

  it('doit gérer l\'erreur de renvoi sans message API (resendLink error générique)', fakeAsync(() => {
      component.email = 'test@example.com';

      mockVerifyService.resendEmailLink.and.returnValue(throwError(() => ({ 
          status: 500, 
          error: {} 
      })));
      
      component.resendLink();
      tick();
      
      expect(component.message).toBe("Échec de l'envoi du nouveau lien. Veuillez réessayer plus tard.");
  }));

  // 9. Couverture de ngOnDestroy()
  it('doit se désabonner de routeSubscription dans ngOnDestroy', () => {
      expect(component['routeSubscription']).toBeTruthy();     
      const unsubscribeSpy = spyOn(component['routeSubscription']!, 'unsubscribe');      
      component.ngOnDestroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
      
      // Couverture du cas où la subscription est null
      component['routeSubscription'] = null;
      component.ngOnDestroy();
      expect(component['routeSubscription']).toBeNull();
  });
});