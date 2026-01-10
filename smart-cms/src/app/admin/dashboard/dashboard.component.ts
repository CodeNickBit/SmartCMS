import { Component, PLATFORM_ID, Inject, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  adminName: string = 'Admin User';
  adminRole: string = 'Administrator';
  lastLogin: string = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          // Combine first and last name if available, otherwise use name or fallback
          this.adminName = user.name || (user.firstName ? `${user.firstName} ${user.lastName}` : 'Admin User');
          this.adminRole = user.role || 'Administrator'; // Capitalize if needed

          // Format last login if available
          if (user.lastLogin) {
            this.lastLogin = new Date(user.lastLogin).toLocaleString();
          } else {
            this.lastLogin = new Date().toLocaleString(); // Fallback to current time
          }

        } catch (e) {
          console.error('Error parsing user data', e);
        }
      }
    }
  }
}
