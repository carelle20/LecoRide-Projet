import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Verify {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  verifyOtp(otp: string, phone: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify/otp`, { otp, phone });
  }

  resendOtp(phone: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify/resend-otp`, { phone });
  }

  verifyEmail(token: string, email: string): Observable<any> { 
    return this.http.get(`${this.apiUrl}/verify/email?token=${token}&email=${email}`);
  }

  resendEmailLink(email: string): Observable<any> { 
    return this.http.post(`${this.apiUrl}/verify/resend-email`, { email });
  }

}
