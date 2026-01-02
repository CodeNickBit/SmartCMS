import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import {  } from '@angular/common'
@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  isLoading: boolean = false;
  errors: { [key: string]: string } = {};
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
          this.authService.setUser(response.user);
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.isLoading = false;
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
}