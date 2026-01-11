import { Component, PLATFORM_ID, Inject, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  adminName: string = 'Admin User';
  adminRole: string = 'Administrator';
  lastLogin: string = '';
  currentDate: Date = new Date();
  searchQuery: string = '';

  quickActions = [
    { icon: 'users', title: 'Manage Users', description: 'View and manage team', color: '#3083DC' },
    { icon: 'user-plus', title: 'Add User', description: 'Create new employee', color: '#10B981' }, // Added Action
    { icon: 'chart', title: 'Analytics', description: 'Performance metrics', color: '#8B5CF6' },
    { icon: 'settings', title: 'Settings', description: 'System preferences', color: '#EE964B' }
  ];

  recentActivities = [
    { action: 'User Login', item: 'John Doe accessed the dashboard', time: '2 mins ago' },
    { action: 'File Uploaded', item: 'Quarterly_Report.pdf', time: '45 mins ago' },
    { action: 'New Project', item: 'SmartCMS Redesign started', time: '3 hours ago' },
    { action: 'Settings Updated', item: 'Email notification preferences', time: '5 hours ago' }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) { }

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

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    }
  }
}
