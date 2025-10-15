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


  it('devrait appeler le service de vérification au démarrage et rediriger en cas de succès', fakeAsync(() => {
    mockVerifyService.verifyEmail.and.returnValue(of({ success: true, message: 'Vérifié' }));

    expect(mockVerifyService.verifyEmail).toHaveBeenCalledWith('valid-test-token', 'test@example.com');
    expect(component.isVerifying).toBe(true);
    
    tick(); 

    expect(component.isVerifying).toBe(false);
    expect(component.success).toBe(true);
    
    expect(mockRouter.navigate).not.toHaveBeenCalled();
    tick(3000); 
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/onboarding']);
    expect(mockTrackingService.track).toHaveBeenCalledWith('EmailVerify_Succeeded', jasmine.anything());
  }));

  
  it('devrait gérer l\'expiration (403) et afficher le bouton de renvoi', fakeAsync(() => {
    const errorResponse = {
        status: 403, 
        error: { message: 'Le lien a expiré.' } 
    };
    
    mockVerifyService.verifyEmail.and.returnValue(throwError(() => errorResponse));

    tick(); 
    expect(component.expired).toBe(true); 
    expect(component.message).toContain('expiré');
    expect(mockTrackingService.track).toHaveBeenCalledWith('EmailVerify_Failed_Expired', jasmine.anything());
  }));


  it('devrait gérer le token invalide (401) sans activer l\'expiration', fakeAsync(() => {
    mockVerifyService.verifyEmail.and.returnValue(throwError(() => ({ 
      status: 401, 
      error: { success: false, message: 'Token invalide.' } 
    })));

    tick(); 

    // Vérification des états après échec 401
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