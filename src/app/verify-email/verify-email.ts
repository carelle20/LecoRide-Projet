import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs'; 
import { Verify } from '../services/verify';
import { Tracking } from '../services/tracking';


@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './verify-email.html',
  styleUrls: ['./verify-email.scss']
})

export class VerifyEmail implements OnInit, OnDestroy {
  isVerifying = true;
  message: string = "";
  success: boolean = false;
  expired: boolean = false;

  token: string | null = null;
  email: string | null = null; 

  private routeSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private router: Router,
    private verifyService: Verify,
    private tracking: Tracking
  ) {}

ngOnInit(): void {
  this.routeSubscription = this.route.queryParams.subscribe(params => {
    this.token = params['token'];
    this.email = params['email'];

    console.log(">>> Paramètres reçus depuis l'URL (Observable):", { token: this.token, email: this.email });

    if (this.token && this.email) {
      this.callVerificationApi();
    } else { 
      this.isVerifying = false;
      this.success = false;
      this.expired = true; 
      this.message = "Lien de vérification invalide ou incomplet.";
      this.toastr.error(this.message);
    }
  });
}

  ngOnDestroy(): void {
      if (this.routeSubscription) {
          this.routeSubscription.unsubscribe();
      }
  }

  private callVerificationApi(): void {
    if (!this.token || !this.email) return;

    this.isVerifying = true; 
    this.tracking.track('EmailVerify_Started', { email: this.email, token: 'received' });
    
    this.verifyService.verifyEmail(this.token, this.email).subscribe({
      next: (res: any) => {
        this.isVerifying = false;
        this.success = true;
        this.expired = false;

        this.tracking.track('EmailVerify_Succeeded', { email: this.email });
        this.router.navigate(['/onboarding']); 
      },

      error: (err) => {
        this.isVerifying = false; 
        this.success = false;
        
        const errorMessage = err.error?.message || "Une erreur est survenue.";
        this.message = errorMessage;
        
        if (err.status === 403) { 
          this.expired = true; 
          this.tracking.track('EmailVerify_Failed_Expired', { email: this.email });
        } else { 
          this.expired = false; 
          this.tracking.track('EmailVerify_Failed_Generic', { email: this.email, status: err.status });
        }
        
        this.toastr.error(this.message);
      }
    });
  }
  
  //fonction de renvoi
  resendLink(): void {
    if (!this.email) return;

    this.tracking.track('EmailResend_Clicked', { email: this.email });
    
    this.isVerifying = true;
    this.expired = false;
    this.message = "Envoi du nouveau lien en cours...";

    this.verifyService.resendEmailLink(this.email).subscribe({
      next: (res) => {
        this.tracking.track('EmailResend_Succeeded', { email: this.email });
        this.isVerifying = false;
        this.success = false;
        this.message = res.message || "Un nouveau lien a été envoyé. Veuillez vérifier votre boîte mail.";
        this.toastr.success(this.message);
      },
      error: (err) => {
        this.tracking.track('EmailResend_Failed', { email: this.email, status: err.status });
        this.isVerifying = false;
        this.expired = true;
        this.message = err.error?.message || "Échec de l'envoi du nouveau lien. Veuillez réessayer plus tard.";
        this.toastr.error(this.message);
      }
    });
  }
}