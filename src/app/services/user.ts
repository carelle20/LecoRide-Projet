import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { Observable, of } from 'rxjs'; 
import { delay, map } from 'rxjs/operators';
import { InscriptionForm } from '../models/inscription-form.model';

@Injectable({
  providedIn: 'root'
})
export class User {
  private apiUrl = 'http://localhost:3000/api/auth'; 

  constructor(private http: HttpClient) { } 

  // Vérification disponibilité email/téléphone 
  checkAvailability(value: string): Observable<boolean> {
    console.log('Checking availability for:', value);
    const unavailable = ['test@used.com', '672345678'];
    return of(!unavailable.includes(value)).pipe(delay(50));
  }

  register(userData: InscriptionForm): Observable<any> {
    console.log('Attempting to register user via API:', userData);
    
    return this.http.post(`${this.apiUrl}/register`, userData);
    
  }
}