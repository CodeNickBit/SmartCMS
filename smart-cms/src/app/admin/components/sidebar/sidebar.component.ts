import { Component, OnInit, PLATFORM_ID, Inject, afterNextRender } from '@angular/core';
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
  ) {
    afterNextRender(() => {
      this.loadUserData();
    });
  }

  ngOnInit() {
    this.forceDarkMode();
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserData();
    }
  }

  private forceDarkMode(): void {
    if (typeof document !== 'undefined') {
      const body = document.body;
      const html = document.documentElement;
      body.classList.remove('theme-light');
      html.classList.remove('theme-light');
      body.classList.add('dark');
      html.classList.add('dark');
    }
  }

  private loadUserData() {
    if (typeof window !== 'undefined' && window.localStorage) {
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
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    }
  }
}
