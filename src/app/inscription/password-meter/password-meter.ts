import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-password-meter',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  templateUrl: './password-meter.html',
  styleUrls: ['./password-meter.scss']
})
export class PasswordMeter implements OnChanges {
  @Input() password: string = '';
  strength = {
    level: 0, messages: [] as string[], barColor: 'transparent'
  };

  constructor(private translate: TranslateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password']) {
      this.calculateStrength(changes['password'].currentValue);
    }
  }

  private calculateStrength(password: string): void {
    // 1. Initialisation
    this.strength.level = 0;
    this.strength.messages = [];
    this.strength.barColor = 'transparent';

    let score = 0;
    const messages: string[] = [];
    let levelMessage: string = ''; 

    if (!password || password.length === 0) {
      this.strength.messages.push(this.translate.instant('FORM.PASSWORD_METER.START_TYPING'));
      return;
    }

    // 2. Évaluation de la Longueur
    if (password.length < 8) {
      messages.push(this.translate.instant('FORM.PASSWORD_METER.MIN_LENGTH'));
    } else {
      score += 1;
    }
    if (password.length >= 10) { 
      score += 0.5
    }

    // 3. Évaluation des Caractères 
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?~]/.test(password);

    if (hasLowercase) score += 0.5; else messages.push(this.translate.instant('FORM.PASSWORD_METER.ADD_LOWERCASE'));
    if (hasUppercase) score += 0.5; else messages.push(this.translate.instant('FORM.PASSWORD_METER.ADD_UPPERCASE'));
    if (hasDigit) score += 0.5; else messages.push(this.translate.instant('FORM.PASSWORD_METER.ADD_DIGIT'));
    if (hasSymbol) score += 0.5; else messages.push(this.translate.instant('FORM.PASSWORD_METER.ADD_SYMBOL'));

    // 4. Évaluation de la Complexité 
    let classesCount = (hasLowercase ? 1 : 0) + (hasUppercase ? 1 : 0) + (hasDigit ? 1 : 0) + (hasSymbol ? 1 : 0);
    if (classesCount >= 3) score += 1;
    if (classesCount >= 4) score += 1;

    // 5. Définition du Niveau de Complexité 
    if (score < 2) {
      this.strength.level = 1;
      this.strength.barColor = 'red';
      levelMessage = this.translate.instant('FORM.PASSWORD_METER.WEAK');
    } else if (score < 3.5) {
      this.strength.level = 2;
      this.strength.barColor = 'Orange';
      levelMessage = this.translate.instant('FORM.PASSWORD_METER.MEDIUM');
    } else if (score < 5) {
      this.strength.level = 3;
      this.strength.barColor = 'yellowgreen';
      levelMessage = this.translate.instant('FORM.PASSWORD_METER.STRONG');
    } else {
      this.strength.level = 4;
      this.strength.barColor = 'green';
      levelMessage = this.translate.instant('FORM.PASSWORD_METER.VERY_STRONG');
    }

    // 6. Assemblage des Messages
    if (messages.length > 0) {
      // Si des suggestions d'amélioration existent, on ajoute le niveau au début.
      messages.unshift(levelMessage);
      this.strength.messages = messages;
    // } else if (password.length >= 8 && classesCount >= 4) {
    //     // Si le mot de passe est très fort et que le tableau messages est vide, on ajoute le message de complexité/solidité.
    //     this.strength.messages.push(this.translate.instant('FORM.PASSWORD_METER.COMPLEX'));
    } else {
      this.strength.messages.push(this.translate.instant('FORM.PASSWORD_METER.SOLID'));
    }
    
    // 7. Surcharge pour Longueur Invalide 
    if (password.length > 0 && password.length < 8) {
      this.strength.messages = [this.translate.instant('FORM.PASSWORD_METER.MIN_LENGTH')];
      this.strength.barColor = 'red';
      this.strength.level = 1;
    }
  }
}