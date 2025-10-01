import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Authentification {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  // Envoyer OTP au backend
  sendOtp(phone: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-otp`, { phone });
  }

  // Vérifier OTP
  verifyOtp(phone: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, { phone, otp });
  }

  registerUser(data: { name: string; phone: string; password: string }) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

}
