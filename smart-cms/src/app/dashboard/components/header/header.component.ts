import { Component, OnInit, PLATFORM_ID, Inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-shared-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="bg-[#1B264F] border-b border-blue-900/30 h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-lg shrink-0">
      <div class="flex items-center space-x-4">
        <h1 class="text-xl font-bold text-white tracking-tight flex items-center">
          SmartCMS
          <span class="ml-3 px-2 py-0.5 bg-[#3083DC]/20 text-[#3083DC] text-[10px] font-bold rounded-md border border-[#3083DC]/30 uppercase tracking-widest">
            {{ userRole }}
          </span>
        </h1>
      </div>

      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <button (click)="onNotificationClick()" class="group relative p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-[#3083DC]/20 transition-all">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span *ngIf="(notificationCount ?? 0) > 0" class="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border border-[#1B264F]"></span>
          </button>

          <button class="group relative p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-[#3083DC]/20 transition-all">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        <!-- User Profile -->
        <div class="flex items-center space-x-4 pl-6 border-l border-blue-900/30">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-bold text-white leading-tight">{{ userName }}</p>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ userEmail }}</p>
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

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  onNotificationClick(): void {
    this.notificationClick.emit();
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
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
