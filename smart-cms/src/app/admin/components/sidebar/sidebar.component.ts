import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class AdminSidebarComponent implements OnInit {
  adminName: string = 'Admin User';
  adminRole: string = 'Administrator';
  lastLogin: string = '';

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
