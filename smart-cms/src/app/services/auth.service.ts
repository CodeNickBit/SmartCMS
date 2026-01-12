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
  token?: string;
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
  setUser(user: any): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('user', JSON.stringify(user));
      // Token might be inside user object or separate, handle both
      if (user.token) {
        localStorage.setItem('token', user.token);
      }
    }
  }

  getUser(): any {
    if (typeof window !== 'undefined' && window.localStorage) {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  isAuthenticated(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      return !!localStorage.getItem('token');
    }
    return false;
  }

  isAdmin(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return user.role === 'admin';
        } catch (e) {
          return false;
        }
      }
    }
    return false;
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/users`);
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put(`${API_URL}/users/${id}`, data);
  }

  updateUserStatus(id: string, status: boolean): Observable<any> {
    return this.http.patch(`${API_URL}/users/${id}/status`, { status });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/users/${id}`);
  }
}
