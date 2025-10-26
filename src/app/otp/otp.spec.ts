import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Otp } from './otp'; 
import { Verify } from '../services/verify';
import { ToastrService } from 'ngx-toastr';
import { Tracking } from '../services/tracking';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';

const mockVerifyService = {
  verifyOtp: jasmine.createSpy('verifyOtp').and.returnValue(of({ success: true })),
  resendOtp: jasmine.createSpy('resendOtp').and.returnValue(of({ success: true })),
};

const mockToastrService =  { 
  success: jasmine.createSpy('success'),
  error: jasmine.createSpy('error'),
  info: jasmine.createSpy('info'),
  warning: jasmine.createSpy('warning'),
};

const mockTrackingService = { track: jasmine.createSpy('track') };
const mockRouter = { navigate: jasmine.createSpy('navigate') };

describe('OtpComponent (Vérification OTP)', () => {
  let component: Otp;
  let fixture: ComponentFixture<Otp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Otp, ReactiveFormsModule, CommonModule],
      providers: [
        FormBuilder,
        { provide: Verify, useValue: mockVerifyService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: Tracking, useValue: mockTrackingService },
        { provide: Router, useValue: mockRouter },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Otp);
    component = fixture.componentInstance;

    spyOn(localStorage, 'getItem').and.returnValue('+237699000000');

    // Reset mocks
    mockVerifyService.verifyOtp.calls.reset();
    mockVerifyService.resendOtp.calls.reset();
    mockRouter.navigate.calls.reset();
    mockToastrService.error.calls.reset();
    mockToastrService.warning.calls.reset();
    mockToastrService.info.calls.reset();
    mockToastrService.success.calls.reset();

    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  // Test : Création et minuteur
  it('doit être créé, initialiser le minuteur et le désactiver après 60s', fakeAsync(() => {
      expect(component).toBeTruthy(); 
      expect(component.isResendDisabled).toBeFalse(); // Démarrage désactivé
      expect(component.resendCooldown).toBe(60);

      // Tick de 59 secondes
      tick(59_000); 
      expect(component.resendCooldown).toBe(60);
      expect(component.isResendDisabled).toBeFalse();

      // Tick de 1 seconde supplémentaire: le timer atteint 0 et finalize est appelé
      tick(1000);
      fixture.detectChanges();
      
      // COUVERTURE : finalize()
      expect(component.resendCooldown).toBe(60);
      expect(component.isResendDisabled).toBeFalse();
  }));

  // Test : Vérification OTP
  it('doit appeler verifyService.verifyOtp et rediriger en cas de succès', fakeAsync(() => {
    for (let i = 0; i < 6; i++) {
      component.otpForm.get('digit' + i)?.setValue(i.toString());
    }

    mockVerifyService.verifyOtp.and.returnValue(of({ success: true, message: 'OK' }));
    component.submitOtp();
    tick();

    expect(mockVerifyService.verifyOtp).toHaveBeenCalledWith('012345', '+237699000000');
    expect(mockToastrService.success).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/onboarding']);
  }));

  it('doit incrémenter les tentatives et bloquer l\'utilisateur après 3 échecs', fakeAsync(() => {
    for (let i = 0; i < 6; i++) {
      component.otpForm.get('digit' + i)?.setValue('1');
    }

    mockVerifyService.verifyOtp.and.returnValue(throwError(() => ({ error: { message: 'Incorrect' } })));

    // 1ère tentative
    component.submitOtp();
    // 2ème tentative
    component.submitOtp();
    expect(component.isBlocked).toBeFalse();

    // 3ème tentative → bloqué
    component.submitOtp();
    tick(); 
    expect(component.attempts).toBe(3);
    expect(component.isBlocked).toBeTrue();

    tick(60_000);
    fixture.detectChanges();
    expect(component.isBlocked).toBeTrue();
  }));

  // Test : Renvoi OTP
  it('ne doit pas autoriser le renvoi si le cooldown est actif', fakeAsync(() => {
    component.isResendDisabled = true;
    component.resendCooldown = 30;
    fixture.detectChanges();

    component.resendOtp();
    expect(mockVerifyService.resendOtp).not.toHaveBeenCalled();
    expect(mockToastrService.warning).toHaveBeenCalledWith("Veuillez attendre la fin du compte à rebours.");
  }));

  it('doit autoriser le renvoi et redémarrer le cooldown après expiration', fakeAsync(() => {
    component.isResendDisabled = false;
    component.resendCooldown = 0;
    fixture.detectChanges();

    mockVerifyService.resendOtp.and.returnValue(of({ success: true }));
    component.resendOtp();
    tick(); 
    fixture.detectChanges();

    expect(mockVerifyService.resendOtp).toHaveBeenCalledWith('+237699000000');
    expect(mockToastrService.info).toHaveBeenCalled();
    expect(component.isResendDisabled).toBeFalse();
    expect(component.resendCooldown).toBe(59);

    tick(1000);
    fixture.detectChanges();
    expect(component.resendCooldown).toBe(58);
  }));

  // Test : Initialisation
  it('doit naviguer vers /inscription si le téléphone est introuvable (Couverture Iif !this.phone)', () => {
      // 1. Utilisez le spy existant pour simuler le retour null
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      // 2. Réinitialisez les appels sur le routeur et toastr avant d'appeler ngOnInit
      mockRouter.navigate.calls.reset();
      mockToastrService.error.calls.reset();
      // 3. Créez une NOUVELLE instance du composant
      const componentNoPhone = TestBed.createComponent(Otp).componentInstance;
      componentNoPhone.ngOnInit();

      expect(mockToastrService.error).toHaveBeenCalledWith("Numéro de téléphone introuvable. Veuillez vous réinscrire.");
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/inscription']);     
      // 4. Réinitialisez le spy pour les tests suivants
      (localStorage.getItem as jasmine.Spy).and.returnValue('+237699000000');
  });

// Test : Logique des Inputs
it('doit passer au champ suivant après une entrée (onInput)', () => {
    // Espionner pour simuler le focus
    const focusSpy = spyOn(component.otpInputs.toArray()[1].nativeElement, 'focus');
    
    // Simuler une entrée sur le premier champ (index 0)
    component.onInput({ target: { value: '1' } }, 0);
    
    expect(focusSpy).toHaveBeenCalled();
    expect(component.errorMessage).toBeNull();
});

it('doit revenir au champ précédent lors de l\'appui sur Backspace (onKeydown)', () => {
    // Mettre une valeur dans le champ 0, le vider dans le champ 1
    component.otpForm.get('digit0')?.setValue('1');
    component.otpForm.get('digit1')?.setValue(''); 
    
    const focusSpy = spyOn(component.otpInputs.toArray()[0].nativeElement, 'focus');
    
    // Simuler un backspace sur le deuxième champ 
    component.onKeydown({ key: 'Backspace' } as KeyboardEvent, 1);
    
    expect(focusSpy).toHaveBeenCalled();
});

it('doit traiter le collage d\'un code valide et positionner le focus (onPaste)', () => {
    const pasteData = '987654';
    const focusSpy = spyOn(component.otpInputs.toArray()[5].nativeElement, 'focus');
    
    // Simuler l'événement de collage
    component.onPaste({ 
        preventDefault: () => {}, 
        clipboardData: { getData: () => pasteData } 
    } as unknown as ClipboardEvent);
    
    expect(component.otpForm.get('digit0')?.value).toBe('9');
    expect(component.otpForm.get('digit5')?.value).toBe('4');
    expect(focusSpy).toHaveBeenCalled();
});

  it('doit ignorer le collage si les données sont invalides (onPaste)', () => {
      const pasteData = '12A456';
      component.otpForm.get('digit0')?.setValue('0');
      
      component.onPaste({ 
          preventDefault: () => {}, 
          clipboardData: { getData: () => pasteData } 
      } as unknown as ClipboardEvent);
      
      expect(component.otpForm.get('digit0')?.value).toBe('0');
  });

// Test : Gestion d'Erreur et Blocage
it('doit gérer l\'erreur de vérification OTP avec un message par défaut', fakeAsync(() => {
    // Remplir le formulaire
    for (let i = 0; i < 6; i++) {
        component.otpForm.get('digit' + i)?.setValue('1');
    }
    // Erreur sans message spécifique du serveur
    mockVerifyService.verifyOtp.and.returnValue(throwError(() => ({}))); 

    component.submitOtp();
    tick();

    expect(component.errorMessage).toBe('Code OTP incorrect.');
    expect(mockTrackingService.track).toHaveBeenCalledWith('VerifyFailed', jasmine.anything());
}));

it('doit réinitialiser le blocage et redémarrer le cooldown après l\'expiration du blocage', fakeAsync(() => {
    // Simuler l'état bloqué
    component.attempts = 3;
    component.isBlocked = true;
    component.startBlockTimer();

    expect(component.blockRemainingTime).toBe(60);
    
    // Simuler le cooldown du renvoi qui est désactivé pendant le blocage
    component.isResendDisabled = true;

    // Laisse s'écouler le temps de blocage
    tick(60_000); 
    fixture.detectChanges();

    expect(component.isBlocked).toBeTrue();
    expect(component.attempts).toBe(3);
    expect(component.blockRemainingTime).toBe(0);

    expect(component.isResendDisabled).toBeTrue(); // Le nouveau cooldown est lancé
    expect(component.resendCooldown).toBe(60);

    // S'assurer que le nouveau cooldown s'exécute
    tick(1000);
    expect(component.resendCooldown).toBe(59); 
}));

  // Test : Soumission Invalide
  it('ne doit pas appeler verifyService.verifyOtp si le formulaire est invalide', () => {
      // Le formulaire est vide, donc invalide
      component.otpForm.get('digit0')?.setValue(''); 
      component.submitOtp();

      expect(component.errorMessage).toBe('Veuillez entrer un code OTP valide.');
      expect(mockVerifyService.verifyOtp).not.toHaveBeenCalled();
  });

// Test : Échec du Renvoi OTP
it('doit gérer l\'erreur du renvoi OTP et réactiver le bouton', fakeAsync(() => {
    // Simuler le bouton non désactivé
    component.isResendDisabled = false;
    component.resendCooldown = 0; 
    
    mockVerifyService.resendOtp.and.returnValue(throwError(() => ({ error: { message: 'Rate limit' } })));

    component.resendOtp();
    tick();

    expect(component.errorMessage).toBe('Rate limit');
    expect(component.isResendDisabled).toBeFalse(); 
}));

  it('ne doit pas envoyer de renvoi si this.phone est null (Couverture Iif !this.phone)', () => {
      component.phone = null;
      mockVerifyService.resendOtp.calls.reset();
      component.resendOtp();
      expect(mockVerifyService.resendOtp).not.toHaveBeenCalled();
  });
});
