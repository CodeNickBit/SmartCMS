import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { EmailVerificationModalComponent } from '../components/email-verification-modal.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EmailVerificationModalComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  phone: string = '';
  password: string = '';
  employeeId: string = '';
  department: string = '';
  designation: string = '';
  joiningDate: string = '';
  employmentType: string = '';
  errors: { [key: string]: string } = {};
  isLoading: boolean = false;
  showPassword: boolean = false;
  showVerificationModal: boolean = false;
  pendingFormData: any = null; // Store form data until OTP is verified

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  validateField(fieldName: string): void {
    delete this.errors[fieldName];

    switch (fieldName) {
      case 'firstName':
        if (!this.firstName.trim()) {
          this.errors['firstName'] = 'First Name is required';
        } else if (this.firstName.trim().length < 2) {
          this.errors['firstName'] = 'First Name must be at least 2 characters';
        }
        break;

      case 'lastName':
        if (!this.lastName.trim()) {
          this.errors['lastName'] = 'Last Name is required';
        } else if (this.lastName.trim().length < 2) {
          this.errors['lastName'] = 'Last Name must be at least 2 characters';
        }
        break;

      case 'email':
        if (!this.email.trim()) {
          this.errors['email'] = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
          this.errors['email'] = 'Please enter a valid email';
        }
        break;

      case 'phone':
        if (this.phone && !/^\d{10}$/.test(this.phone)) {
          this.errors['phone'] = 'Phone must be 10 digits';
        }
        break;

      case 'password':
        if (!this.password.trim()) {
          this.errors['password'] = 'Password is required';
        } else if (this.password.length < 8) {
          this.errors['password'] = 'Password must be at least 8 characters';
        }
        break;

      case 'employeeId':
        if (!this.employeeId.trim()) {
          this.errors['employeeId'] = 'Employee ID is required';
        }
        break;

      case 'department':
        if (!this.department) {
          this.errors['department'] = 'Department is required';
        }
        break;

      case 'designation':
        if (!this.designation.trim()) {
          this.errors['designation'] = 'Designation is required';
        }
        break;

      case 'employmentType':
        if (!this.employmentType) {
          this.errors['employmentType'] = 'Employment Type is required';
        }
        break;
    }
  }

  validateForm(): boolean {
    this.errors = {};
    this.validateField('firstName');
    this.validateField('lastName');
    this.validateField('email');
    this.validateField('password');
    this.validateField('employeeId');
    this.validateField('department');
    this.validateField('designation');
    this.validateField('employmentType');

    return Object.keys(this.errors).length === 0;
  }

  onSubmit() {
    if (this.isLoading || !this.validateForm()) {
      return;
    }

    // Store form data temporarily (don't register yet)
    this.pendingFormData = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim().toLowerCase(),
      phone: this.phone.trim() || undefined,
      password: this.password,
      employeeId: this.employeeId.trim().toUpperCase(),
      department: this.department.trim(),
      designation: this.designation.trim(),
      employmentType: this.employmentType,
      joiningDate: this.joiningDate || undefined,
    };

    // Show email verification modal first (registration happens after OTP verification)
    this.showVerificationModal = true;
  }

  onEmailVerified(otp: string) {
    if (!this.pendingFormData) {
      return;
    }

    this.isLoading = true;
    this.showVerificationModal = false;

    // Check if admin is registering
    const isAdminRegistering = typeof window !== 'undefined' && sessionStorage.getItem('adminRegistering') === 'true';

    // Now register the user after OTP is verified
    this.authService.register(this.pendingFormData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Registration successful:', response);
        
        // Clear the admin registering flag
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('adminRegistering');
        }
        
        // If admin was registering, redirect to admin dashboard
        if (isAdminRegistering) {
          this.router.navigate(['/admin/dashboard']);
        } else {
          // Otherwise redirect to login page
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        // Handle error response
        if (error.error && error.error.message) {
          this.errors['general'] = error.error.message;
        } else {
          this.errors['general'] = 'Registration failed. Please try again.';
        }
        // Show modal again if registration fails
        this.showVerificationModal = true;
      }
    });
  }

  onModalClosed() {
    this.showVerificationModal = false;
    this.pendingFormData = null; // Clear pending data if modal is closed
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, ''); // Remove non-digits
    this.phone = value;
    if (value) {
      this.validateField('phone');
    }
  }
}
