import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs'; 
import { delay, map } from 'rxjs/operators';
import { InscriptionForm } from '../models/inscription-form.model';

@Injectable({
  providedIn: 'root'
})
export class User {
  constructor() { }

  // Vérification disponibilité email/téléphone
  checkAvailability(value: string): Observable<boolean> {
    console.log('Checking availability for:', value);

    // On simule que ces valeurs sont déjà utilisées
    const unavailable = ['test@used.com', '672345678'];
    return of(!unavailable.includes(value)).pipe(delay(50));
  }

  // Simulation de l'inscription
  register(userData: InscriptionForm): Observable<any> {
    console.log('Attempting to register user:', userData);

    // Cas simules pour les tests
    if (userData.emailPhone === 'utilise@example.com') {
      return of({}).pipe(
        delay(50),
        map(() => { throw { status: 409, message: 'Email/Numéro déjà utilisé' }; })
      );
    }

    if (userData.emailPhone === 'invalide@example.com') {
      return of({}).pipe(
        delay(50),
        map(() => { throw { status: 400, message: 'Données invalides' }; })
      );
    }

    if (userData.emailPhone === 'erreur@example.com') {
      return of({}).pipe(
        delay(50),
        map(() => { throw { status: 500, message: 'Erreur serveur' }; })
      );
    }

    return of({ success: true }).pipe(delay(50));
  }
}
