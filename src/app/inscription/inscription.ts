import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core'; 
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, of, Subscription, timer } from 'rxjs'; 
import { switchMap, map, catchError } from 'rxjs/operators';
import { User } from '../services/user'; 
import { PasswordMeter } from './password-meter/password-meter'; 
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InscriptionForm } from '../models/inscription-form.model'; 
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
// import { HttpClient } from '@angular/common/http';

// Validateur email/téléphone
function emailOrPhoneValidator(): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null; 

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0|\+237)6\d{8}$/;

    const isEmail = emailRegex.test(value);
    const isPhone = phoneRegex.test(value);

    return isEmail || isPhone ? null : { emailOrPhoneInvalid: true };
  };
}

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    PasswordMeter, 
    TranslateModule
  ],
  providers: [TranslateService],
  templateUrl: './inscription.html', 
  styleUrls: ['./inscription.scss'] 
})
export class Inscription implements OnInit, OnDestroy { 
  inscriptionForm: FormGroup; 
  currentLanguage: string = 'fr';
  isLoading: boolean = false; 
  errorMessage: string | null = null; 
  private subscriptions = new Subscription(); 

  constructor (
    private userService: User, 
    private translate: TranslateService,
    private toastr: ToastrService,
    private router: Router
    // private http: HttpClient
  ) {
    this.translate.addLangs(['fr', 'en']);
    this.translate.setDefaultLang('fr');
    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang?.match(/fr|en/) ? browserLang : 'fr');

    // Initialisation du formulaire
    this.inscriptionForm = new FormGroup({
      firstName: new FormControl('', Validators.required), 
      lastName: new FormControl('', Validators.required),  
      emailPhone: new FormControl('', {
        validators: [Validators.required, emailOrPhoneValidator()],
        asyncValidators: [this.emailPhoneAvailabilityValidator],
        updateOn: 'blur'
      }),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]), 
      consent: new FormControl(false, Validators.requiredTrue)
    });
  }

  ngOnInit(): void {
    this.currentLanguage = this.translate.currentLang || 'fr';
  }

  ngOnDestroy(): void { 
    this.subscriptions.unsubscribe();
  }

  changeLanguage(lang: string) {
    this.translate.use(lang);
    this.currentLanguage = lang;
  }

  // Vérification de la disponibilité email ou téléphone
  emailPhoneAvailabilityValidator: AsyncValidatorFn = (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value;
    if (!value) return of(null);

    return timer(100).pipe(
      switchMap(() => this.userService.checkAvailability(value).pipe(
        map(isAvailable => isAvailable ? null : { emailPhoneTaken: true }),
        catchError(() => of(null))
      ))
    );
  };

  // Soumission du formulaire
  onSubmit() {
    this.errorMessage = null; 

    if (this.inscriptionForm.invalid) {
      this.inscriptionForm.markAllAsTouched(); 
      this.errorMessage = this.translate.instant('FORM.ERROR.FORM_INVALID');
      return; 
    }

    this.isLoading = true; 
    const formData: InscriptionForm = this.inscriptionForm.value as InscriptionForm; 
    
    this.subscriptions.add( 
      this.userService.register(formData).subscribe({
        next: (response: any) => {
          console.log('Inscription réussie !', response);
          this.isLoading = false; 
          
          this.toastr.success(
            this.translate.instant('FORM.SUCCESS_MESSAGE'),
            this.translate.instant('APP.TITLE')
          );

          const phoneRegex = /^(0|\+237)6\d{8}$/;
          if (phoneRegex.test(formData.emailPhone)) {
            localStorage.setItem('phone', formData.emailPhone);
            this.router.navigate(['/otp']);
          } else {
            const registeredEmail = response.email || formData.emailPhone;
            
            this.toastr.warning("Veuillez vérifier votre boîte mail pour activer votre compte.");

            this.router.navigate(['/email-confirmation'], { 
            queryParams: { email: registeredEmail } 
            });
          }
        },
        error: (err) => {
          this.isLoading = false; 
          if (err.status === 409) {
            this.errorMessage = this.translate.instant('FORM.ERROR.EMAIL_PHONE_TAKEN_API');
            this.inscriptionForm.get('emailPhone')?.setErrors({ emailPhoneTaken: true }); 
          } else if (err.status === 400) {
            this.errorMessage = this.translate.instant('FORM.ERROR.BAD_REQUEST_API');
          } else {
            this.errorMessage = this.translate.instant('FORM.ERROR.GENERIC_API_ERROR');
          }
          this.inscriptionForm.markAllAsTouched(); 
        }
      })
    );
  }


  get fc() {
    return this.inscriptionForm.controls;
  }
}
