import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './onboarding.html',
  styleUrls: ['./onboarding.scss']
})
export class Onboarding implements OnInit {
  
  steps = [
    { id: 1, name: 'Bienvenue' },
    { id: 2, name: 'Photo de profil'},
    { id: 3, name: 'Terminé', icon: '✅' },
  ];
  
  currentStep: number = 1;

  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log("Démarrage du flux Onboarding pour le nouvel utilisateur.");
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length) {
      this.currentStep++;
      console.log(`Passage à l'étape ${this.currentStep}: ${this.steps[this.currentStep - 1].name}`);
    } else {
      this.finishOnboarding();
    }
  }

  finishOnboarding(): void {
    
    console.log("Onboarding terminé ! Redirection vers le tableau de bord.");
    this.router.navigate(['/dashboard']);

  }

  /**
   * @param stepId 
   * @returns 
   */
  isCompleted(stepId: number): boolean {
    return stepId < this.currentStep;
  }
  
  isActive(stepId: number): boolean {
    return stepId === this.currentStep;
  }
}