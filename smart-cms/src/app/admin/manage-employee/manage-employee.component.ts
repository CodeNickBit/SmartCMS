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
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-manage-employee',
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
    MatSelectModule
  ],
  templateUrl: './manage-employee.component.html',
  styleUrl: './manage-employee.component.css'
})
export class ManageEmployeeComponent implements OnInit {
  adminName: string = 'Admin User';
  adminRole: string = 'Administrator';
  lastLogin: string = '';

  // Employee State
  employees: any[] = [];
  searchQuery: string = '';
  filterStatus: string = 'All';

  // Edit Mode State
  isEditing: boolean = false;
  editingEmployee: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.loadAdminData();
    this.loadEmployees();
  }

  loadAdminData() {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.adminName = user.name || (user.firstName ? `${user.firstName} ${user.lastName}` : 'Admin User');
          this.adminRole = user.role || 'Administrator';
          this.lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString() : new Date().toLocaleString();
        } catch (e) {
          console.error('Error parsing user data', e);
        }
      }
    }
  }

  loadEmployees() {
    this.authService.getUsers().subscribe({
      next: (data: any[]) => {
        this.employees = data;
      },
      error: (err: any) => {
        console.error('Failed to fetch employees', err);
      }
    });
  }

  get filteredEmployees() {
    return this.employees.filter(emp => {
      const name = emp.name || `${emp.firstName} ${emp.lastName}`;
      const matchesSearch = name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(this.searchQuery.toLowerCase()));
      
        const status = emp.active_inactive !== false ? 'Active' : 'Inactive';
      const matchesStatus = this.filterStatus === 'All' || status === this.filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }

  setStatusFilter(status: string) {
    this.filterStatus = status;
  }

  getDisplayName(emp: any): string {
    return emp.name || `${emp.firstName} ${emp.lastName}`;
  }

  // Actions
  editEmployee(emp: any) {
    this.editingEmployee = { ...emp };
    // Format joiningDate for date input (YYYY-MM-DD)
    if (this.editingEmployee.joiningDate) {
      const date = new Date(this.editingEmployee.joiningDate);
      if (!isNaN(date.getTime())) {
        this.editingEmployee.joiningDate = date.toISOString().split('T')[0];
      }
    }
    this.isEditing = true;
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingEmployee = null;
  }

  saveEmployee() {
    if (!this.editingEmployee) return;

    this.authService.updateUser(this.editingEmployee._id, this.editingEmployee).subscribe({
      next: () => {
        this.loadEmployees();
        this.isEditing = false;
        this.editingEmployee = null;
        alert('Employee updated successfully');
      },
      error: (err: any) => {
        console.error('Update failed', err);
        alert('Failed to update employee');
      }
    });
  }

  toggleStatus(emp: any) {
    const newStatus = emp.active_inactive === false; // Toggle
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} this employee?`)) {
      this.authService.updateUserStatus(emp._id, newStatus).subscribe({
        next: () => {
          this.loadEmployees();
          alert(`Employee ${newStatus ? 'activated' : 'deactivated'} successfully`);
        },
        error: (err: any) => {
          console.error('Status update failed', err);
          alert('Failed to update status');
        }
      });
    }
  }

  deleteEmployee(emp: any) {
    const employeeName = this.getDisplayName(emp);
    if (confirm(`Are you sure you want to permanently delete ${employeeName}? This action cannot be undone.`)) {
      this.authService.deleteUser(emp._id).subscribe({
        next: () => {
          this.loadEmployees();
          alert('Employee deleted successfully');
        },
        error: (err: any) => {
          console.error('Delete failed', err);
          alert('Failed to delete employee');
        }
      });
    }
  }

  empUpload() {
    alert('EMP Upload functionality coming soon!');
  }

  navigateToRegister() {
    // Store flag to indicate admin is registering
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('adminRegistering', 'true');
    }
    this.router.navigate(['/signup']);
  }

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
}
