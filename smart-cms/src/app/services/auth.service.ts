import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

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
  token?: string;
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
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.userSubject.next(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing saved user', e);
      }
    }
  }

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

  setUser(user: any): void {
    this.userSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): any {
    return this.userSubject.value;
  }

  logout(): void {
    this.userSubject.next(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
