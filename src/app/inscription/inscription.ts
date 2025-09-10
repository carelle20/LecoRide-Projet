import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core'; 
import { ReactiveFormsModule, FormGroup, FormControl, 
  Validators, AsyncValidatorFn, AbstractControl, ValidationErrors 
} from '@angular/forms';
import { Observable, timer, of, Subscription } from 'rxjs'; 
import { switchMap, map, catchError } from 'rxjs/operators';
import { User } from '../services/user'; 
import { PasswordMeter } from './password-meter/password-meter'; 
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InscriptionForm } from '../models/inscription-form.model'; 

// Validateur synchrone personnalisé pour email ou téléphone
function emailOrPhoneValidator(): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null; 
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const phoneRegex = /^(0|\+237)[6]\d{8}$/; 

    const isEmail = emailRegex.test(value);
    const isPhone = phoneRegex.test(value);

    if (isEmail || isPhone) {
      return null; 
    }
    return { emailOrPhoneInvalid: true }; 
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
  templateUrl: './inscription.html', 
  styleUrl: './inscription.scss' 
})
export class Inscription implements OnInit, OnDestroy { 
  inscriptionForm: FormGroup; 
  currentLanguage: string = 'fr';
  isLoading: boolean = false; 
  errorMessage: string | null = null; 
  private subscriptions = new Subscription(); 

  constructor (
    private userService: User, 
    private translate: TranslateService
  ) {
    // Initialisation du service de traduction
    this.translate.addLangs(['fr', 'en']);
    this.translate.setDefaultLang('fr');
    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang?.match(/fr|en/) ? browserLang : 'fr');

    this.inscriptionForm = new FormGroup ({
      firstName: new FormControl('', Validators.required), 
      lastName: new FormControl('', Validators.required),  
      emailPhone: new FormControl('', [Validators.required, emailOrPhoneValidator()],
        [this.emailPhoneAvailabilityValidator.bind(this)] 
      ), 
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

  // Définition du validateur asynchrone
  emailPhoneAvailabilityValidator: AsyncValidatorFn = (control: AbstractControl): Observable<ValidationErrors | null> => {
    return timer(400).pipe( //debounceTime de 400ms
      switchMap(() => { 
        const value = control.value;
        if (!value) {
          return of(null);
        }
        return this.userService.checkAvailability(value).pipe(
          map(isAvailable => {
            return isAvailable ? null : { emailPhoneTaken: true};
          }),
          catchError((err) => {
            console.error('Erreur lors de la vérification de disponibilité:', err);
            return of(null); // Ne pas bloquer la soumission du formulaire en cas d'erreur de vérification
          })
        );
      })
    );
  };

  // Méthode appelée lors de la soumission du formulaire
  onSubmit() {
    this.errorMessage = null; 

    if (this.inscriptionForm.invalid) {
      this.inscriptionForm.markAllAsTouched(); 
      console.log('Formulaire invalide.', this.inscriptionForm);
      this.errorMessage = this.translate.instant('FORM.ERROR.FORM_INVALID'); // Message générique pour formulaire invalide
      return; 
    }

    this.isLoading = true; 

    // Les valeurs du formulaire sont maintenant typées avec InscriptionForm !
    const formData: InscriptionForm = this.inscriptionForm.value as InscriptionForm; 
    
    this.subscriptions.add( 
      this.userService.register(formData).subscribe({
        next: (response) => {
          console.log('Inscription réussie !', response);
          this.inscriptionForm.reset(); 
          this.isLoading = false; 
          alert(this.translate.instant('FORM.SUCCESS_MESSAGE')); 
        },
        error: (err) => {
          console.error('Erreur lors de l\'inscription:', err);
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

  // Getter pour faciliter l'accès aux contrôles du formulaire dans le template
  get fc() {
    return this.inscriptionForm.controls;
  }
}