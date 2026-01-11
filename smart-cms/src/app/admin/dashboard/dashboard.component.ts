import { Component, PLATFORM_ID, Inject, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  userName: string = 'Admin User';
  adminRole: string = 'Administrator';
  lastLogin: string = '';
  currentDate: Date = new Date();

  quickActions = [
    { title: 'Add New User', description: 'Create a new staff account', icon: 'users', color: '#3083DC' },
    { title: 'Project Files', description: 'Manage project documents', icon: 'folder', color: '#10B981' },
    { title: 'Analytics', description: 'View system performance', icon: 'chart', color: '#8B5CF6' },
    { title: 'Settings', description: 'Configure system options', icon: 'settings', color: '#EE964B' }
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
          this.userName = user.name || (user.firstName ? `${user.firstName} ${user.lastName}` : 'Admin User');
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
