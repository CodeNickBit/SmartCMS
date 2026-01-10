import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.css'
})
export class AddUserComponent implements OnInit {
  // ... (properties unchanged)
  adminName: string = 'Admin User';
  adminRole: string = 'Administrator';
  lastLogin: string = '';

  // Form State
  selectedRole: 'admin' | 'hr' | 'manager' = 'admin';
  showModal: boolean = false;
  modalRole: string = '';
  showPassword: boolean = false;
  successMessage: string = '';

  newUser = {
    name: '',
    email: '',
    password: '',
    role: 'admin'
  };

  // Table State
  filterRole: string = 'All';
  searchQuery: string = '';

  // Dummy Data
  users = [
    { id: 'USR001', name: 'John Doe', email: 'john@example.com', role: 'Admin', dept: 'IT', status: 'Active' },
    { id: 'USR002', name: 'Jane Smith', email: 'jane@example.com', role: 'HR', dept: 'Human Resources', status: 'Active' },
    { id: 'USR003', name: 'Robert Johnson', email: 'robert@example.com', role: 'Manager', dept: 'Sales', status: 'Inactive' },
    { id: 'USR004', name: 'Emily Davis', email: 'emily@example.com', role: 'HR', dept: 'Human Resources', status: 'Active' },
    { id: 'USR005', name: 'Michael Wilson', email: 'michael@example.com', role: 'Manager', dept: 'Operations', status: 'Active' },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private authService: AuthService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.adminName = user.name || (user.firstName ? `${user.firstName} ${user.lastName}` : 'Admin User');
          this.adminRole = user.role || 'Administrator';

          if (user.lastLogin) {
            this.lastLogin = new Date(user.lastLogin).toLocaleString();
          } else {
            this.lastLogin = new Date().toLocaleString();
          }

        } catch (e) {
          console.error('Error parsing user data', e);
        }
      }
    }
  }

  get filteredUsers() {
    return this.users.filter(user => {
      const matchesRole = this.filterRole === 'All' || user.role.toLowerCase() === this.filterRole.toLowerCase();
      const matchesSearch = user.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }

  setRole(role: string) {
    this.filterRole = role;
    if (role !== 'All') {
      this.selectedRole = role as any;
    }
  }

  openModal(role: string) {
    this.modalRole = role;
    this.newUser.role = role.toLowerCase();
    this.showModal = true;
    this.showPassword = false;
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Validation
  errors: { [key: string]: string } = {};

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  validateField(fieldName: string): void {
    switch (fieldName) {
      case 'name':
        if (!this.newUser.name.trim()) {
          this.errors['name'] = 'Full Name is required';
        } else {
          delete this.errors['name'];
        }
        break;

      case 'email':
        if (!this.newUser.email.trim()) {
          this.errors['email'] = 'Email is required';
        } else if (!this.validateEmail(this.newUser.email)) {
          this.errors['email'] = 'Please enter a valid email address';
        } else {
          delete this.errors['email'];
        }
        break;

      case 'password':
        if (!this.newUser.password) {
          this.errors['password'] = 'Password is required';
        } else if (this.newUser.password.length < 6) {
          this.errors['password'] = 'Password must be at least 6 characters';
        } else {
          delete this.errors['password'];
        }
        break;
    }
  }

  validateForm(): boolean {
    this.errors = {};
    this.validateField('name');
    this.validateField('email');
    this.validateField('password');
    return Object.keys(this.errors).length === 0;
  }

  submitUser() {
    if (!this.validateForm()) {
      return;
    }

    console.log('Creating User:', this.newUser);

    this.authService.registerAdmin(this.newUser).subscribe({
      next: (response) => {
        // Show success message
        this.successMessage = `Successfully created ${this.modalRole} user: ${this.newUser.name}`;
        this.snackBar.open(this.successMessage, 'Close', { duration: 3000, horizontalPosition: 'right', verticalPosition: 'top', panelClass: ['success-snackbar'] });
        this.closeModal();

        // Clear message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error creating user:', error);
        // Display backend error as a general error or alert
        if (error.error?.message) {
          this.snackBar.open(error.error.message, 'Close', { duration: 3000, horizontalPosition: 'right', verticalPosition: 'top', panelClass: ['error-snackbar'] });
        } else {
          this.snackBar.open('Failed to create user', 'Close', { duration: 3000, horizontalPosition: 'right', verticalPosition: 'top', panelClass: ['error-snackbar'] });
        }
      }
    });
  }

  resetForm() {
    this.newUser = {
      name: '',
      email: '',
      password: '',
      role: 'admin'
    };
  }
}
