import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Inscription } from './inscription'; 
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateService, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { PasswordMeter } from './password-meter/password-meter';
import { CommonModule } from '@angular/common';
import { ToastrModule } from 'ngx-toastr';


function emailOrPhoneValidator(): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) { return null; }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const phoneRegex = /^(0|\+237)[6]\d{8}$/;
    const isEmail = emailRegex.test(value);
    const isPhone = phoneRegex.test(value);
    if (isEmail || isPhone) { return null; }
    return { emailOrPhoneInvalid: true }; 
  };
}

// Mock de TranslateLoader
class CustomTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of({
      'FORM.ERROR.REQUIRED': 'Ce champ est requis.',
      'FORM.ERROR.EMAIL_OR_PHONE_INVALID': 'Email/téléphone invalide.'
    });
  }
}

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

describe('Inscription', () => {
  let component: Inscription;
  let fixture: ComponentFixture<Inscription>;
  let translate: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        CommonModule,
        PasswordMeter,
        Inscription,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: CustomTranslateLoader }
        }),
        ToastrModule.forRoot()
      ],
      providers: [TranslateService]
    }).compileComponents();

    fixture = TestBed.createComponent(Inscription);
    component = fixture.componentInstance;
    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('fr');
    translate.use('fr');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty controls', () => {
    expect(component.inscriptionForm).toBeDefined();
    expect(component.inscriptionForm.get('firstName')?.value).toBe('');
    expect(component.inscriptionForm.get('lastName')?.value).toBe('');
    expect(component.inscriptionForm.get('emailPhone')?.value).toBe('');
    expect(component.inscriptionForm.get('password')?.value).toBe('');
    expect(component.inscriptionForm.get('consent')?.value).toBe(false);
  });

  it('should mark firstName as invalid when empty', () => {
    const firstNameControl = component.inscriptionForm.get('firstName');
    firstNameControl?.setValue('');
    expect(firstNameControl?.valid).toBeFalse();
    expect(firstNameControl?.errors?.['required']).toBeTrue();
  });

  it('should mark firstName as valid when filled', () => {
    const firstNameControl = component.inscriptionForm.get('firstName');
    firstNameControl?.setValue('John');
    expect(firstNameControl?.valid).toBeTrue();
    expect(firstNameControl?.errors).toBeNull();
  });

  it('should mark lastName as invalid when empty', () => {
    const lastNameControl = component.inscriptionForm.get('lastName');
    lastNameControl?.setValue('');
    expect(lastNameControl?.valid).toBeFalse();
    expect(lastNameControl?.errors?.['required']).toBeTrue();
  });

  it('should mark lastName as valid when filled', () => {
    const lastNameControl = component.inscriptionForm.get('lastName');
    lastNameControl?.setValue('Doe');
    expect(lastNameControl?.valid).toBeTrue();
    expect(lastNameControl?.errors).toBeNull();
  });

  it('should mark consent as invalid when false', () => {
    const consentControl = component.inscriptionForm.get('consent');
    consentControl?.setValue(false);
    consentControl?.markAsTouched();
    consentControl?.updateValueAndValidity();

    expect(consentControl?.valid).toBeFalse();
    //expect(consentControl?.errors?.['requiredTrue']).toBeTrue();
    expect(consentControl?.errors).toBeTruthy(); 
  });




  it('should mark consent as valid when true', () => {
    const consentControl = component.inscriptionForm.get('consent');
    consentControl?.setValue(true);
    consentControl?.updateValueAndValidity();

    expect(consentControl?.valid).toBeTrue();
    expect(consentControl?.errors).toBeNull();
  });


  it('should mark password as invalid when less than 8 characters', () => {
    const passwordControl = component.inscriptionForm.get('password');
    passwordControl?.setValue('short');
    expect(passwordControl?.valid).toBeFalse();
    expect(passwordControl?.errors?.['minlength']).toBeTruthy();
  });

  it('should mark password as valid when 8 or more characters', () => {
    const passwordControl = component.inscriptionForm.get('password');
    passwordControl?.setValue('longpassword');
    expect(passwordControl?.valid).toBeTrue();
    expect(passwordControl?.errors).toBeNull();
  });
});

