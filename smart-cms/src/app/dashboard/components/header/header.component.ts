import { Component, OnInit, PLATFORM_ID, Inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-shared-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border-b border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-lg shrink-0">
      <div class="flex items-center space-x-4">
        <h1 class="text-xl font-bold text-slate-800 light:text-[#0D1B35] dark:text-white tracking-tight flex items-center">
          SmartCMS
          <span class="ml-3 px-2 py-0.5 bg-[#3083DC]/20 text-[#3083DC] text-[10px] font-bold rounded-md border border-[#3083DC]/30 uppercase tracking-widest">
            {{ userRole }}
          </span>
        </h1>
      </div>

      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <!-- Theme Toggle Switch -->
          <button (click)="toggleTheme()" type="button" 
            class="relative inline-flex h-6 w-11 items-center flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3083DC] focus:ring-offset-2 focus:ring-offset-white light:focus:ring-offset-[#DDEAF8] dark:focus:ring-offset-[#1B264F] theme-toggle-btn" 
            [ngClass]="{'bg-[#3083DC]': isDarkMode, 'bg-[#1A6DC2]': !isDarkMode, 'is-dark': isDarkMode, 'is-light': !isDarkMode}" 
            role="switch" 
            [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
            [attr.aria-checked]="isDarkMode">
            <span class="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" 
              [ngClass]="{'translate-x-5': isDarkMode, 'translate-x-0': !isDarkMode}">
              <!-- Moon icon — visible in dark mode -->
              <svg *ngIf="isDarkMode" xmlns="http://www.w3.org/2000/svg"
                class="absolute inset-0 m-auto text-[#3083DC]" width="13" height="13" viewBox="0 0 24 24"
                fill="currentColor">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
              <!-- Sun icon — visible in light mode -->
              <svg *ngIf="!isDarkMode" xmlns="http://www.w3.org/2000/svg"
                class="absolute inset-0 m-auto text-[#C96A1A]" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
              </svg>
            </span>
          </button>

          <button (click)="onNotificationClick()" class="group relative p-2.5 rounded-full text-slate-500 light:text-[#7A96B2] dark:text-slate-400 hover:text-white hover:bg-[#3083DC]/20 transition-all">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span *ngIf="notificationCount > 0" class="absolute -top-1 -right-1 bg-rose-500 text-slate-800 light:text-[#0D1B35] dark:text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#1B264F] min-w-[1.25rem] text-center flex items-center justify-center">
              {{ notificationCount > 9 ? '9+' : notificationCount }}
            </span>
          </button>

          <button class="group relative p-2.5 rounded-full text-slate-500 light:text-[#7A96B2] dark:text-slate-400 hover:text-white hover:bg-[#3083DC]/20 transition-all">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        <!-- User Profile -->
        <div class="flex items-center space-x-4 pl-6 border-l border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-bold text-slate-800 light:text-[#0D1B35] dark:text-white leading-tight">{{ userName }}</p>
            <p class="text-[10px] font-bold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase tracking-widest">{{ userEmail }}</p>
          </div>
          <div class="h-10 w-10 rounded-lg bg-[#3083DC]/20 flex items-center justify-center text-[#3083DC] font-bold border border-[#3083DC]/30 shadow-sm overflow-hidden group hover:border-[#3083DC] transition-all">
            <span>{{ userName.charAt(0).toUpperCase() }}</span>
          </div>
        </div>
      </div>
    </header>
  `
})
export class SharedHeaderComponent implements OnInit {
  @Input() notificationCount: number = 0;
  @Output() notificationClick = new EventEmitter<void>();

  userName: string = 'User';
  userEmail: string = '';
  userRole: string = '';
  isDarkMode: boolean = true;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (isPlatformBrowser(this.platformId)) {
      this.applyTheme();
    }
  }

  private applyTheme(): void {
    const body = document.body;
    const html = document.documentElement;
    if (this.isDarkMode) {
      body.classList.add('theme-dark', 'dark');
      html.classList.add('dark');
      body.classList.remove('theme-light');
      localStorage.setItem('theme', 'dark');
    } else {
      body.classList.add('theme-light');
      body.classList.remove('theme-dark', 'dark');
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  onNotificationClick(): void {
    this.notificationClick.emit();
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      this.isDarkMode = savedTheme !== 'light'; // Default to dark 
      this.applyTheme();

      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.userName = user.name || (user.firstName ? `${user.firstName} ${user.lastName}` : 'User');
          this.userEmail = user.email || '';
          this.userRole = user.role || '';
        } catch (e) {
          console.error('Error parsing user data', e);
        }
      }
    }
  }
}
