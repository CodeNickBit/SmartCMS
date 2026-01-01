import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(private router: Router) {}

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

    this.isLoading = true;

    const formData = {
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
  }
}
