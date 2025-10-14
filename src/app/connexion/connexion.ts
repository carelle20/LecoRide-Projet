import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Authentification } from '../services/authentification';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-connexion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './connexion.html',
  styleUrls: ['./connexion.scss']
})
export class Connexion implements OnInit {
  loginForm!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: Authentification,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      emailPhone: ['', [Validators.required]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.toastr.warning('Veuillez remplir correctement tous les champs.');
      return;
    }

    this.loading = true;
    const { emailPhone, password } = this.loginForm.value;

    this.authService.login(emailPhone, password).subscribe({
      next: (response) => {
        this.loading = false;
        this.toastr.success('Connexion réussie ! Bienvenue.');
        
        this.router.navigate(['/dashboard']); 
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || 'Erreur de connexion. Vérifiez vos identifiants.';
        this.toastr.error(errorMessage);
      }
    });
  }

}

