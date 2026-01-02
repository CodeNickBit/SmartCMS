import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api/auth';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  employeeId: string;
  department: string;
  designation: string;
  employmentType: string;
  joiningDate?: string;
}

export interface RegisterResponse {
  message: string;
  user: any;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: any;
  role?: string;
}

export interface OTPResponse {
  message: string;
}

export interface VerifyOTPResponse {
  message: string;
  verified: boolean;
  resetToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) { }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${API_URL}/register`, data);
  }

  registerAdmin(data: any): Observable<any> {
    return this.http.post(`${API_URL}/register-admin`, data);
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/login`, data);
  }

  sendOTP(email: string): Observable<OTPResponse> {
    return this.http.post<OTPResponse>(`${API_URL}/send-otp`, { email });
  }

  verifyOTP(email: string, otp: string, isPasswordReset: boolean = false): Observable<VerifyOTPResponse> {
    return this.http.post<VerifyOTPResponse>(`${API_URL}/verify-otp`, { email, otp, isPasswordReset });
  }

  resetPassword(email: string, newPassword: string, resetToken: string): Observable<any> {
    return this.http.post(`${API_URL}/reset-password`, { email, newPassword, resetToken });
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  setUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  }
}
