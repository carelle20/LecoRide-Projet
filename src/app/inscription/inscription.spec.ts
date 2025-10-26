import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl, Validators, AbstractControl, ValidationErrors, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Inscription, emailOrPhoneValidator } from './inscription'; 
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateService, TranslateLoader } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { PasswordMeter } from './password-meter/password-meter';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { User } from '../services/user';

// MOCK SERVICES & CONSTANTS

// 1. Définition des traductions simulées
const MOCK_TRANSLATIONS: { [key: string]: string } = {
    'APP.TITLE': 'Créez votre compte',
    'FORM.SUCCESS_MESSAGE': 'Inscription réussie ! Un email de confirmation a été envoyé.',
    'FORM.ERROR.REQUIRED': 'Ce champ est requis.',
    'FORM.ERROR.EMAIL_OR_PHONE_INVALID': 'Veuillez saisir un email valide ou un numéro de téléphone valide.',
    'FORM.ERROR.EMAIL_PHONE_TAKEN_API': "Cet email/numéro est déjà utilisé. Veuillez vous connecter.",
    'FORM.ERROR.BAD_REQUEST_API': "Les données envoyées sont invalides. Veuillez vérifier le formulaire.",
    'FORM.ERROR.GENERIC_API_ERROR': "Une erreur est survenue lors de l'inscription. Veuillez réessayer.",
    'FORM.ERROR.FORM_INVALID': "Veuillez corriger les erreurs dans le formulaire."
};

// 2. Mock de TranslateLoader
class CustomTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of(MOCK_TRANSLATIONS);
  }
}

// 3. Mocks des services externes
const mockUserService = {
  checkAvailability: (value: string) => of(true), 
  register: (data: any) => of({ email: data.emailPhone }),
};
const mockToastrService = {
  success: jasmine.createSpy('success'),
  warning: jasmine.createSpy('warning'),
};
const mockRouter = {
  navigate: jasmine.createSpy('navigate'),
};

describe('emailOrPhoneValidator', () => {
  it('should return null for a valid email', () => {
    const control = new FormControl('test@example.com');
    expect(emailOrPhoneValidator()(control)).toBeNull();
  });
   it('should return null for a valid phone number (+237)', () => {
    const control = new FormControl('+237677123456');
    expect(emailOrPhoneValidator()(control)).toBeNull();
  });

  it('should return null for a valid phone number (06...)', () => {
    const control = new FormControl('0677123456');
    expect(emailOrPhoneValidator()(control)).toBeNull();
  });

  it('should return emailOrPhoneInvalid for an invalid format', () => {
    const control = new FormControl('invalid-email-or-phone');
    expect(emailOrPhoneValidator()(control)).toEqual({ emailOrPhoneInvalid: true });
  });

  it('should return null for an empty value (handled by required separately)', () => {
    const control = new FormControl('');
    expect(emailOrPhoneValidator()(control)).toBeNull();
  });

  it('should return emailOrPhoneInvalid for incomplete phone number', () => {
    const control = new FormControl('+23767712345');
    expect(emailOrPhoneValidator()(control)).toEqual({ emailOrPhoneInvalid: true });
  });

  it('should return emailOrPhoneInvalid for incomplete email', () => {
    const control = new FormControl('test@example');
    expect(emailOrPhoneValidator()(control)).toEqual({ emailOrPhoneInvalid: true });
  });
});

describe('Inscription Component', () => {
  let component: Inscription;
  let fixture: ComponentFixture<Inscription>;
  let userService: any;
  let translateService: TranslateService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        CommonModule,
        Inscription,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: CustomTranslateLoader }
        }),
      ],
      providers: [
        { provide: User, useValue: mockUserService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: Router, useValue: mockRouter },
        TranslateService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Inscription);
    component = fixture.componentInstance;
    userService = TestBed.inject(User);
    translateService = TestBed.inject(TranslateService);
    router = TestBed.inject(Router);

    spyOn(translateService, 'instant').and.callFake((key: string) => MOCK_TRANSLATIONS[key] || key);

    // Initialisation
    fixture.detectChanges();
    
    // Réinitialisation des Mocks
    mockRouter.navigate.calls.reset();
    mockToastrService.success.calls.reset();
    mockToastrService.warning.calls.reset();
    localStorage.clear();
  });

  // Tests de base et gestion de langue
  it('doit s\'initialiser correctement', () => {
    expect(component).toBeTruthy();
    expect(component.currentLanguage).toBe('en'); 
  });
  
  it('doit changer la langue', () => {
    component.changeLanguage('en');
    expect(translateService.currentLang).toBe('en');
    expect(component.currentLanguage).toBe('en');
  });

  it('doit se désinscrire des abonnements lors de la destruction', () => {
    const subscriptions = (component as any).subscriptions;
    spyOn(subscriptions, 'unsubscribe');
    component.ngOnDestroy();
    expect(subscriptions.unsubscribe).toHaveBeenCalled();
  });

  // Tests des validateurs asynchrones
  const getEmailPhoneControl = () => component.inscriptionForm.get('emailPhone') as AbstractControl;

  it('doit valider l\'email/téléphone s\'il est disponible', fakeAsync(() => {
    const control = getEmailPhoneControl();
    spyOn(userService, 'checkAvailability').and.returnValue(of(true));
    
    control.setValue('available@test.com');
    control.updateValueAndValidity();
    tick(100);
    
    expect(control.pending).toBeFalse();
    expect(control.hasError('emailPhoneTaken')).toBeFalsy();
  }));

  it('doit marquer l\'email/téléphone comme non disponible', fakeAsync(() => {
    const control = getEmailPhoneControl();
    spyOn(userService, 'checkAvailability').and.returnValue(of(false));
    
    control.setValue('taken@test.com');
    control.updateValueAndValidity();
    tick(100); 
    
    expect(control.pending).toBeFalse();
    expect(control.hasError('emailPhoneTaken')).toBeTrue();
  }));
  
  it('doit ignorer l\'erreur API lors de la vérification de disponibilité', fakeAsync(() => {
    const control = getEmailPhoneControl();
    spyOn(userService, 'checkAvailability').and.returnValue(throwError(() => new Error('API Error')));
    
    control.setValue('error@test.com');
    control.updateValueAndValidity();
    tick(100); 
    
    expect(control.pending).toBeFalse();
    expect(control.hasError('emailPhoneTaken')).toBeFalsy();
  }));

  // Tests de soumission
  const setupValidForm = (emailPhoneValue: string, isConsent = true) => {
    component.inscriptionForm.setValue({
      firstName: 'Jean',
      lastName: 'Dupont',
      emailPhone: emailPhoneValue,
      password: 'StrongPassword1!',
      consent: isConsent,
    });
  };

  // 1. Soumission Invalide
  it('doit bloquer la soumission, marquer les champs et afficher le message d\'erreur', () => {
    const registerSpy = spyOn(userService, 'register');
    component.inscriptionForm.markAsUntouched(); 
    component.onSubmit();
    
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe(MOCK_TRANSLATIONS['FORM.ERROR.FORM_INVALID']);
    expect(component.inscriptionForm.get('firstName')?.touched).toBeTrue();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  // 2. Soumission Réussie (Cas Téléphone)
  it('doit naviguer vers /otp et stocker le téléphone si l\'identifiant est un téléphone', fakeAsync(() => {
    const phone = '+237677123456';
    setupValidForm(phone);
    spyOn(userService, 'register').and.returnValue(of({ phone: phone }));

    component.onSubmit();
    
    expect(component.isLoading).toBeFalse();
    tick(); // Exécute la souscription
    expect(component.isLoading).toBeFalse();
    expect(mockToastrService.success).toHaveBeenCalledWith(MOCK_TRANSLATIONS['FORM.SUCCESS_MESSAGE'], MOCK_TRANSLATIONS['APP.TITLE']);
    expect(localStorage.getItem('phone')).toBe(phone);
    expect(router.navigate).toHaveBeenCalledWith(['/otp']);
  }));


  // 3. Soumission Réussie (Cas Email)
  it('doit naviguer vers /email-confirmation et afficher un avertissement pour la confirmation', fakeAsync(() => {
    const email = 'jean.dupont@test.com';
    setupValidForm(email);
    // Le service retourne un objet de succès avec l'email
    spyOn(userService, 'register').and.returnValue(of({ email: email }));

    component.onSubmit();
    tick();
    expect(mockToastrService.warning).toHaveBeenCalledWith("Veuillez vérifier votre boîte mail pour activer votre compte.");
    expect(router.navigate).toHaveBeenCalledWith(['/email-confirmation'], { 
        queryParams: { email: email } 
    });
  }));
  
  // 4. Gestion des Erreurs API
  it('doit gérer l\'erreur 409 (Conflit), afficher le message et marquer emailPhone comme pris', fakeAsync(() => {
    setupValidForm('taken@test.com');
    const emailPhoneControl = getEmailPhoneControl();
    spyOn(userService, 'register').and.returnValue(throwError(() => ({ status: 409 })));
    
    component.onSubmit();
    tick(); 
    
    expect(component.errorMessage).toBe(MOCK_TRANSLATIONS['FORM.ERROR.EMAIL_PHONE_TAKEN_API']); 
    expect(emailPhoneControl.hasError('emailPhoneTaken')).toBeTrue();
    expect(component.isLoading).toBeFalse();
  }));

  it('doit gérer l\'erreur 400 (Bad Request) et afficher le message approprié', fakeAsync(() => {
    setupValidForm('bad@request.com');
    spyOn(userService, 'register').and.returnValue(throwError(() => ({ status: 400 })));
    
    component.onSubmit();
    tick(); 
    
    expect(component.errorMessage).toBe(MOCK_TRANSLATIONS['FORM.ERROR.BAD_REQUEST_API']);
    expect(component.isLoading).toBeFalse();
  }));

  it('doit gérer les erreurs génériques (500, etc.) et marquer le formulaire comme touché', fakeAsync(() => {
    setupValidForm('generic@error.com');
    spyOn(userService, 'register').and.returnValue(throwError(() => ({ status: 500 })));
    
    component.onSubmit();
    tick(); 
    
    expect(component.errorMessage).toBe(MOCK_TRANSLATIONS['FORM.ERROR.GENERIC_API_ERROR']);
    expect(component.inscriptionForm.touched).toBeTrue(); // Vérifie markAllAsTouched
    expect(component.isLoading).toBeFalse();
  }));
});