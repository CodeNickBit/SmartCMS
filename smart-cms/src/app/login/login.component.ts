import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
  template: `
    <div class="min-h-screen bg-[#101935] flex items-center justify-center p-4 font-sans text-white">
      <div class="w-full max-w-md bg-[#1B264F] rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        <div class="p-8">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p class="text-gray-400">Sign in to access your dashboard</p>
          </div>

          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="space-y-2">
              <label for="email" class="text-sm font-medium text-gray-300">Email Address</label>
              <input type="email" id="email" [(ngModel)]="email" name="email" required 
                class="w-full bg-[#101935] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3083DC]"
                placeholder="name@company.com">
              <p *ngIf="errors['email']" class="text-[#EE964B] text-xs">{{ errors['email'] }}</p>
            </div>

            <div class="space-y-2">
              <label for="password" class="text-sm font-medium text-gray-300">Password</label>
              <input type="password" id="password" [(ngModel)]="password" name="password" required 
                class="w-full bg-[#101935] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3083DC]"
                placeholder="Enter your password">
              <p *ngIf="errors['password']" class="text-[#EE964B] text-xs">{{ errors['password'] }}</p>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input type="checkbox" id="remember" [(ngModel)]="rememberMe" name="rememberMe"
                  class="h-4 w-4 rounded border-gray-600 bg-[#101935] text-[#3083DC] focus:ring-[#3083DC]">
                <label for="remember" class="ml-2 text-sm text-gray-300">Remember me</label>
              </div>
              <button type="button" (click)="openForgotModal()" class="text-sm text-[#3083DC] hover:text-[#206bc4] hover:underline">
                Forgot password?
              </button>
            </div>

            <p *ngIf="errors['general']" class="text-[#EE964B] text-sm text-center">{{ errors['general'] }}</p>

            <button type="submit" [disabled]="isLoading"
              class="w-full bg-[#3083DC] hover:bg-[#206bc4] text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>
        </div>
        <div class="bg-[#152042] px-8 py-4 border-t border-gray-700 text-center">
          <p class="text-sm text-gray-400">
            Don't have an account? <a href="/signup" class="text-[#3083DC] hover:underline font-medium">Sign up</a>
          </p>
        </div>
      </div>

      <!-- Forgot Password Modal -->
      <div *ngIf="showForgotModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-[#1B264F] rounded-xl shadow-2xl w-full max-w-md border border-gray-600 overflow-hidden">
          <div class="p-6 border-b border-gray-700 flex justify-between items-center">
            <h3 class="text-xl font-bold text-white">Reset Password</h3>
            <button (click)="closeForgotModal()" class="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="p-6 space-y-4">
            <!-- Step 1: Email -->
            <div *ngIf="resetStep === 1" class="space-y-4">
              <p class="text-gray-300 text-sm">Enter your email address to receive a verification code.</p>
              <input type="email" [(ngModel)]="resetEmail" placeholder="Enter your email" 
                class="w-full bg-[#101935] border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#3083DC]">
              <button (click)="sendResetOtp()" [disabled]="resetLoading || !resetEmail"
                class="w-full bg-[#3083DC] hover:bg-[#206bc4] text-white font-semibold py-3 rounded-lg disabled:opacity-50">
                {{ resetLoading ? 'Sending...' : 'Send OTP' }}
              </button>
            </div>

            <!-- Step 2: OTP -->
            <div *ngIf="resetStep === 2" class="space-y-4">
              <p class="text-gray-300 text-sm">Enter the 6-digit code sent to <span class="text-[#3083DC]">{{resetEmail}}</span></p>
              <input type="text" [(ngModel)]="resetOtp" placeholder="Enter 6-digit OTP" maxlength="6"
                class="w-full bg-[#101935] border border-gray-600 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-[#3083DC]">
              <button (click)="verifyResetOtp()" [disabled]="resetLoading || resetOtp.length !== 6"
                class="w-full bg-[#3083DC] hover:bg-[#206bc4] text-white font-semibold py-3 rounded-lg disabled:opacity-50">
                {{ resetLoading ? 'Verifying...' : 'Verify OTP' }}
              </button>
              <button (click)="resetStep = 1" class="w-full text-gray-400 text-sm hover:text-white">Change Email</button>
            </div>

            <!-- Step 3: New Password -->
            <div *ngIf="resetStep === 3" class="space-y-4">
              <p class="text-gray-300 text-sm">Create a new password for your account.</p>
              <input type="password" [(ngModel)]="newPassword" placeholder="New Password (min 8 chars)" 
                class="w-full bg-[#101935] border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#3083DC]">
              <input type="password" [(ngModel)]="confirmPassword" placeholder="Confirm New Password" 
                class="w-full bg-[#101935] border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#3083DC]">
              <button (click)="submitResetPassword()" [disabled]="resetLoading || !newPassword || !confirmPassword"
                class="w-full bg-[#3083DC] hover:bg-[#206bc4] text-white font-semibold py-3 rounded-lg disabled:opacity-50">
                {{ resetLoading ? 'Resetting...' : 'Reset Password' }}
              </button>
            </div>

            <p *ngIf="resetError" class="text-[#EE964B] text-sm text-center bg-red-900/20 p-2 rounded">{{ resetError }}</p>
          </div>
        </div>
      </div>
    </div>
  `
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
      // Scroll to first error
      const firstError = Object.keys(this.errors)[0];
      if (firstError) {
        const element = document.querySelector(`[name="${firstError}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    this.isLoading = true;
    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          alert(response.message);

          // Store session
          localStorage.setItem('token', response.user.token || ''); // Assuming token might be in user object or separate
          localStorage.setItem('user', JSON.stringify(response.user));

          alert(response.message);

          // Store session
          localStorage.setItem('token', response.user.token || ''); // Assuming token might be in user object or separate
          localStorage.setItem('user', JSON.stringify(response.user));

          // Navigate based on role
          if (response.role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            // Navigate to user dashboard or home page
            // this.router.navigate(['/dashboard']);
          }

          this.authService.setUser(response.user);
          this.router.navigate(['/home']);
            // Navigate based on role
            if (response.role === 'admin') {
              this.router.navigate(['/admin/dashboard']);
            } else {
              // Navigate to user dashboard or home page
              this.router.navigate(['/home']);
            }

        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login Error:', error);
          if (error.error && error.error.message) {
            alert(error.error.message);
            this.errors['general'] = error.error.message;
          } else {
            alert('Login failed: ' + error.message);
            this.errors['general'] = 'Login failed: ' + error.message;
          }
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