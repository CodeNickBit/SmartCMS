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

  // Real data from backend
  users: any[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private authService: AuthService, private confirmationModal: ConfirmationModalService) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUsers();
    }
  }

  loadUsers() {
    this.authService.getUsers().subscribe({
      next: (data: any[]) => {
        // Filter to only show admin roles
        this.users = data.filter(user => user.role === 'admin'
        ).map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: this.capitalizeRole(user.role),
          dept: user.department || 'N/A',
          status: user.active_inactive !== false ? 'Active' : 'Inactive'
        }));
      },
      error: (err: any) => {
        console.error('Failed to fetch users', err);
      }
    });
  }

  capitalizeRole(role: string): string {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
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
        this.loadUsers(); // Reload the users list
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

  confirmToggleStatus(user: any) {
    const isCurrentlyActive = user.status === 'Active';
    const action = isCurrentlyActive ? 'deactivate' : 'activate';
    const targetStatus = !isCurrentlyActive;

    // Prevent self-deactivation
    const currentUser = this.authService.getUser();
    const currentUserId = currentUser?.id || currentUser?._id;
    const targetUserId = user.id || user._id;

    if (isCurrentlyActive && currentUserId === targetUserId) {
      this.confirmationModal.alert(
        'Action Denied', 
        'For security reasons, you cannot deactivate your own admin account. Another admin must perform this action.', 
        'error'
      );
      return;
    }

    this.confirmationModal.confirm({
      title: `${isCurrentlyActive ? 'Deactivate' : 'Activate'} Admin`,
      message: `Are you sure you want to ${action} admin ${user.name}?`,
      confirmText: `Yes, ${isCurrentlyActive ? 'Deactivate' : 'Activate'}`,
      cancelText: 'Cancel',
      type: isCurrentlyActive ? 'warning' : 'info'
    }).then(confirmed => {
      if (!confirmed) return;
      this.authService.updateUserStatus(user.id, targetStatus).subscribe({
        next: () => {
          this.successMessage = `Admin ${action}d successfully`;
          this.loadUsers();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.confirmationModal.alert('Error', error.error?.message || `Failed to ${action} admin`, 'error');
        }
      });
    });
  }
}
