import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';
import { ConfirmationModalService } from '../../shared/confirmation-modal.service';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminSidebarComponent,
    AdminHeaderComponent
  ],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.css'
})
export class AddUserComponent implements OnInit {
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

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private authService: AuthService, private confirmationModal: ConfirmationModalService) { }

  ngOnInit() {
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

    this.authService.registerAdmin(this.newUser).subscribe({
      next: (response) => {
        this.successMessage = `Successfully created ${this.modalRole} user: ${this.newUser.name}`;
        this.closeModal();
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.confirmationModal.alert('Error', error.error?.message || 'Failed to create user', 'error');
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
