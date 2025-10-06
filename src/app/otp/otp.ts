import { Component, OnInit, OnDestroy, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Verify } from '../services/verify'; 
import { Tracking } from '../services/tracking';
import { Subscription, interval } from 'rxjs';
import { takeWhile, finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './otp.html',
  styleUrls: ['./otp.scss']
})
export class Otp implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

  otpForm!: FormGroup;
  otpLength: number = 6;
  errorMessage: string | null = null;
  phone: string | null = null;
  
  resendCooldown: number = 60;
  resendTimerSubscription: Subscription | null = null;
  isResendDisabled: boolean = false;
  
  maxAttempts: number = 3;
  attempts: number = 0;    
  blockTimerSubscription: Subscription | null = null;
  blockRemainingTime: number = 0;
  isBlocked: boolean = false;

  constructor(
    private fb: FormBuilder,
    private verifyService: Verify,
    private trackingService: Tracking,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.otpForm = new FormGroup ({
      code: new FormControl({ value: '', disabled: true}, Validators.required)
    })
    this.otpForm.get('code')?.enable();
    this.otpForm.get('code')?.disable();
  }

  ngOnInit(): void {
    this.initOtpForm();
    this.startResendCooldown();
    this.phone = localStorage.getItem('phone');

    if (!this.phone) {
        // Gérer l'erreur si le numéro de téléphone n'est pas trouvé
        this.toastr.error("Numéro de téléphone introuvable. Veuillez vous réinscrire.");
        this.router.navigate(['/inscription']);
        return;
    }

  }

  ngOnDestroy(): void {
    this.resendTimerSubscription?.unsubscribe();
    this.blockTimerSubscription?.unsubscribe();
  }

  initOtpForm(): void {
    const formControls: { [key: string]: any } = {};
    for (let i = 0; i < this.otpLength; i++) {
      formControls['digit' + i] = ['', [Validators.required, Validators.pattern(/^[0-9]$/)]];
    }
    this.otpForm = this.fb.group(formControls);
  }

  onInput(event: any, index: number): void {
    this.errorMessage = null;
    const input = event.target;
    if (input.value.length === 1 && index < this.otpLength - 1) {
      this.otpInputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && index > 0 && !this.otpForm.get('digit' + index)?.value) {
      this.otpInputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text').trim();
    if (pasteData && pasteData.length === this.otpLength && /^\d+$/.test(pasteData)) {
      pasteData.split('').forEach((char, i) => {
        this.otpForm.get('digit' + i)?.setValue(char);
      });
      this.otpInputs.toArray()[this.otpLength - 1].nativeElement.focus();
    }
  }

  get otpDigits(): string[] {
    return Array.from({ length: this.otpLength }, (_, i) => this.otpForm.get('digit' + i)?.value || '');
  }


  submitOtp(): void {
    if (this.otpForm.invalid || !this.phone) {
      this.errorMessage = 'Veuillez entrer un code OTP valide.';
      return;
    }

    this.trackingService.track('VerifyStarted', { type: 'OTP' });
    const otp = this.otpDigits.join('');

    console.log("OTP envoyé :", otp, "Téléphone :", this.phone);
    this.verifyService.verifyOtp(otp, this.phone).subscribe({
      next: () => {
        this.trackingService.track('VerifySucceeded', { type: 'OTP' });
        this.toastr.success("Vérification réussie ! Bienvenue");
        this.router.navigate(['/onboarding']);
      },
      error: (err) => {
        this.attempts++;
        this.errorMessage = err.error?.message || 'Code OTP incorrect.';
        this.trackingService.track('VerifyFailed', { type: 'OTP', attempts: this.attempts, error: this.errorMessage });
        if (this.attempts >= this.maxAttempts) {
          this.isBlocked = true;
          this.startBlockTimer();
          this.attempts = 0;
        }
      }
    });
  }

  startResendCooldown(): void {
    this.isResendDisabled = true;
    this.resendTimerSubscription?.unsubscribe();

    this.resendTimerSubscription = interval(1000).pipe(
      takeWhile(() => this.resendCooldown > 0),
      finalize(() => {
        this.isResendDisabled = false;
        this.resendCooldown = 60;
      })
    ).subscribe(() => {
      this.resendCooldown--;
    });
  }

  resendOtp(): void {
    if (this.isResendDisabled || !this.phone) return;
    this.errorMessage = null;
    this.isResendDisabled = true;

    this.verifyService.resendOtp(this.phone).subscribe({
      next: () => {
        this.startResendCooldown();
        this.toastr.info("Nouveau code OTP envoyé !");
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors du renvoi de l’OTP.';
        this.isResendDisabled = false;
      }
    });
  }

  startBlockTimer(): void {
    this.blockRemainingTime = 60;
    this.blockTimerSubscription?.unsubscribe();

    this.blockTimerSubscription = interval(1000).pipe(
      takeWhile(() => this.blockRemainingTime > 0),
      finalize(() => {
        this.isBlocked = false;
        this.blockRemainingTime = 0;
        this.startResendCooldown();
      })
    ).subscribe(() => {
      this.blockRemainingTime--;
    });
  }
}
