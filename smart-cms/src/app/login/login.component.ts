import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
    console.log('Login attempt:', { 
      email: this.email, 
      password: this.password,
      rememberMe: this.rememberMe,
      timestamp: new Date().toISOString()
    });
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      // Add your authentication logic here
      console.log('Authentication completed');
    }, 2000);
  }
}
