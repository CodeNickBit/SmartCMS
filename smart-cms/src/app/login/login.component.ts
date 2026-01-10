import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  isLoading: boolean = false;
  errors: { [key: string]: string } = {};

  // Forgot Password State
  showForgotModal: boolean = false;
  resetStep: number = 1; // 1: Email, 2: OTP, 3: New Password
  resetEmail: string = '';
  resetOtp: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  resetToken: string = '';
  resetLoading: boolean = false;
  resetError: string = '';

  showPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) { }

  // Validate Email
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // Validate single field
  validateField(fieldName: string): void {
    switch (fieldName) {
      case 'email':
        if (!this.email.trim()) {
          this.errors['email'] = 'Email is required';
        } else if (!this.validateEmail(this.email)) {
          this.errors['email'] = 'Please enter a valid email address';
        } else {
          delete this.errors['email'];
        }
        break;

      case 'password':
        if (!this.password) {
          this.errors['password'] = 'Password is required';
        } else if (this.password.length < 6) {
          this.errors['password'] = 'Password must be at least 6 characters';
        } else {
          delete this.errors['password'];
        }
        break;
    }
  }

  // Validate entire form
  validateForm(): boolean {
    this.errors = {};
    this.validateField('email');
    this.validateField('password');
    return Object.keys(this.errors).length === 0;
  }

  onSubmit() {
    if (this.isLoading) return;

    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.authService.setUser(response.user);
          
          if (response.role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/home']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login Error:', error);
          this.errors['general'] = error.error?.message || 'Login failed: ' + error.message;
        }
      });
  }

  // Forgot Password Methods
  openForgotModal() {
    this.showForgotModal = true;
    this.resetStep = 1;
    this.resetEmail = '';
    this.resetOtp = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.resetError = '';
  }

  closeForgotModal() {
    this.showForgotModal = false;
  }

  sendResetOtp() {
    if (!this.validateEmail(this.resetEmail)) {
      this.resetError = 'Please enter a valid email address';
      return;
    }
    this.resetLoading = true;
    this.resetError = '';
    this.authService.sendOTP(this.resetEmail).subscribe({
      next: (res) => {
        this.resetLoading = false;
        this.resetStep = 2;
      },
      error: (err) => {
        this.resetLoading = false;
        console.error('Send OTP Error:', err);
        this.resetError = err.error?.message || 'Failed to send OTP';
      }
    });
  }

  verifyResetOtp() {
    this.resetLoading = true;
    this.resetError = '';
    this.authService.verifyOTP(this.resetEmail, this.resetOtp, true).subscribe({
      next: (res) => {
        this.resetLoading = false;
        this.resetToken = res.resetToken || '';
        this.resetStep = 3;
      },
      error: (err) => {
        this.resetLoading = false;
        console.error('Verify OTP Error:', err);
        this.resetError = err.error?.message || 'Invalid OTP';
      }
    });
  }

  submitResetPassword() {
    if (this.newPassword.length < 8) {
      this.resetError = 'Password must be at least 8 characters';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.resetError = 'Passwords do not match';
      return;
    }

    this.resetLoading = true;
    this.resetError = '';
    this.authService.resetPassword(this.resetEmail, this.newPassword, this.resetToken).subscribe({
      next: (res) => {
        this.resetLoading = false;
        alert('Password reset successfully! You can now login with your new password.');
        this.closeForgotModal();
      },
      error: (err) => {
        this.resetLoading = false;
        console.error('Reset Password Error:', err);
        this.resetError = err.error?.message || 'Failed to reset password';
      }
    });
  }
}
