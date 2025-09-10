import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { Observable, of, throwError } from 'rxjs'; 
import { delay, tap } from 'rxjs/operators'; 
import { InscriptionForm } from '../models/inscription-form.model'; // <-- Assurez-vous que ce chemin est correct

@Injectable({
  providedIn: 'root'
})
export class User { // Garde le nom User pour ne pas casser le composant
  constructor(private http: HttpClient) { }

  checkAvailability(value: string): Observable<boolean> {
    console.log('Checking availability for:', value);
    return of(value !== 'test@used.com' && value !== '672345678')
      .pipe(delay(500));
  }

  register(userData: InscriptionForm): Observable<any> {
    console.log('Attempting to register user:', userData);

    return of(userData)
      .pipe(
        delay(1000), 
        tap(() => {
          if (userData.emailPhone === 'conflict@example.com') {
            console.error('Simulating 409 Conflict for:', userData.emailPhone);
            throw { status: 409, message: 'Email/Numéro déjà utilisé' };
          }
          if (userData.emailPhone === 'badrequest@example.com') {
            console.error('Simulating 400 Bad Request for:', userData.emailPhone);
            throw { status: 400, message: 'Données d\'inscription invalides' };
          }
          if (userData.emailPhone === 'fail@example.com') {
            console.error('Simulating generic error for:', userData.emailPhone);
            throw { status: 500, message: 'Erreur serveur interne' };
          }
          console.log('Simulated registration success for:', userData.emailPhone);
        })
      );
  }
}