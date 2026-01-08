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

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private authService: AuthService) { }

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
      next: (data) => {
        this.employees = data;
      },
      error: (err) => {
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

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
}
