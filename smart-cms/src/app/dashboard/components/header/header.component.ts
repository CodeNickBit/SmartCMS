import { Component, OnInit, PLATFORM_ID, Inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileModalComponent } from '../profile-modal/profile-modal.component';
import { NotificationService, Notification } from '../../../services/notification.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-shared-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ProfileModalComponent],
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

          <div class="relative">
            <button (click)="toggleNotifications($event)" class="group relative p-2.5 rounded-full text-slate-500 light:text-[#7A96B2] dark:text-slate-400 hover:text-white hover:bg-[#3083DC]/20 transition-all">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span *ngIf="unreadCount > 0" class="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#1B264F] min-w-[1.25rem] text-center flex items-center justify-center">
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            </button>

            <!-- Notifications Dropdown -->
            <div *ngIf="showNotifications" (click)="$event.stopPropagation()" class="absolute right-0 mt-3 w-80 sm:w-96 bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] rounded-2xl shadow-2xl border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 overflow-hidden animate-fade-in z-50">
              <!-- Dropdown Header -->
              <div class="p-4 border-b border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 flex items-center justify-between bg-slate-50/50 light:bg-[#EEF3FA]/50 dark:bg-black/20">
                <h3 class="text-sm font-bold text-slate-800 light:text-[#0D1B35] dark:text-white">Notifications</h3>
                <button (click)="markAllAsRead()" *ngIf="unreadCount > 0" class="text-[11px] font-bold text-[#3083DC] hover:text-[#206bc4] transition-colors">Mark all as read</button>
              </div>

              <!-- Tabs -->
              <div class="flex border-b border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 px-2 bg-slate-50/30 light:bg-[#EEF3FA]/30 dark:bg-black/10">
                <button *ngFor="let tab of tabs" (click)="currentTab = tab" 
                  [class]="'px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all relative ' + (currentTab === tab ? 'text-[#3083DC]' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200')">
                  {{ tab }}
                  <div *ngIf="currentTab === tab" class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3083DC] rounded-t-full"></div>
                </button>
              </div>

              <!-- Notifications List -->
              <div class="max-h-[400px] overflow-y-auto custom-scrollbar">
                <div *ngIf="filteredNotifications.length === 0" class="p-8 text-center">
                  <div class="h-12 w-12 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p class="text-sm font-medium text-slate-500 dark:text-slate-400">No notifications found</p>
                </div>

                <div *ngFor="let note of filteredNotifications" (click)="markAsRead(note)"
                  class="p-4 border-b border-slate-100 light:border-[#1A6DC2]/10 dark:border-blue-900/10 hover:bg-slate-50 light:hover:bg-[#EEF3FA]/50 dark:hover:bg-white/5 transition-colors cursor-pointer relative group">
                  <div class="flex gap-4">
                    <!-- Icon based on category -->
                    <div [class]="'h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ' + getCategoryColor(note.category)">
                      <svg *ngIf="note.category === 'Task'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      <svg *ngIf="note.category === 'Leave'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <svg *ngIf="note.category === 'Attendance'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <svg *ngIf="note.category === 'General' || note.category === 'System' || note.category === 'Payroll'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                        <p class="text-xs font-bold text-slate-800 light:text-[#0D1B35] dark:text-white truncate pr-2">{{ note.title }}</p>
                        <div class="flex items-center gap-2 shrink-0">
                          <span class="text-[10px] font-medium text-slate-400">{{ note.createdAt | date:'shortTime' }}</span>
                          <button (click)="deleteNotification(note, $event)" class="p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded-md transition-all text-slate-400" title="Clear">
                            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p class="text-[11px] text-slate-600 light:text-[#3D5A7A] dark:text-slate-400 line-clamp-2 leading-relaxed">{{ note.message }}</p>
                    </div>
                  </div>
                  <!-- Unread indicator -->
                  <div *ngIf="!note.isRead" class="absolute top-4 right-4 h-2 w-2 bg-[#3083DC] rounded-full"></div>
                </div>
              </div>

              <!-- Footer -->
              <div class="p-3 bg-slate-50/50 light:bg-[#EEF3FA]/50 dark:bg-black/20 text-center border-t border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30">
                <button class="text-[11px] font-bold text-slate-500 hover:text-[#3083DC] transition-colors">See earlier notifications</button>
              </div>
            </div>
          </div>

          <button class="group relative p-2.5 rounded-full text-slate-500 light:text-[#7A96B2] dark:text-slate-400 hover:text-white hover:bg-[#3083DC]/20 transition-all">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        <!-- User Profile -->
        <div class="flex items-center space-x-4 pl-6 border-l border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 cursor-pointer group" (click)="openProfile()">
          <div class="text-right hidden sm:block group-hover:opacity-80 transition-opacity">
            <p class="text-sm font-bold text-slate-800 light:text-[#0D1B35] dark:text-white leading-tight">{{ userName }}</p>
            <p class="text-[10px] font-bold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase tracking-widest">{{ userEmail }}</p>
          </div>
          <div class="h-10 w-10 rounded-lg bg-[#3083DC]/20 flex items-center justify-center text-[#3083DC] font-bold border border-[#3083DC]/30 shadow-sm overflow-hidden group-hover:scale-105 group-hover:bg-[#3083DC]/30 transition-all">
            <span>{{ userName.charAt(0).toUpperCase() }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Profile Modal -->
    <app-profile-modal
      *ngIf="showProfileModal"
      [user]="currentUser"
      (close)="closeProfile()">
    </app-profile-modal>
  `
})
export class SharedHeaderComponent implements OnInit {
  @Input() notificationCount: number = 0;
  @Output() notificationClick = new EventEmitter<void>();

  userName: string = 'User';
  userEmail: string = '';
  userRole: string = '';
  isDarkMode: boolean = true;
  currentUser: any = null;
  showProfileModal: boolean = false;

  // Notification states
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showNotifications: boolean = false;
  currentTab: string = 'All';
  tabs = ['All', 'Unread', 'Work', 'General'];
  private pollingSub?: Subscription;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private notificationService: NotificationService
  ) { }

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

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.fetchNotifications();
    }
  }

  fetchNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.unreadCount = data.filter(n => !n.isRead).length;
      },
      error: (err) => console.error('Error fetching notifications:', err)
    });
  }

  markAsRead(note: Notification) {
    if (!note.isRead) {
      this.notificationService.markAsRead(note._id).subscribe(() => {
        note.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      this.unreadCount = 0;
    });
  }

  deleteNotification(note: Notification, event: Event) {
    event.stopPropagation();
    this.notificationService.deleteNotification(note._id).subscribe(() => {
      this.notifications = this.notifications.filter(n => n._id !== note._id);
      this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    });
  }

  get filteredNotifications(): Notification[] {
    switch (this.currentTab) {
      case 'Unread':
        return this.notifications.filter(n => !n.isRead);
      case 'Work':
        return this.notifications.filter(n => ['Task', 'Attendance'].includes(n.category));
      case 'General':
        return this.notifications.filter(n => ['Leave', 'Payroll', 'System', 'General'].includes(n.category));
      default:
        return this.notifications;
    }
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'Task': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'Leave': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'Attendance': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'Payroll': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
    }
  }

  openProfile() {
    this.showProfileModal = true;
  }

  closeProfile() {
    this.showProfileModal = false;
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
          this.currentUser = user;
          this.userName = user.name || (user.firstName ? `${user.firstName} ${user.lastName}` : 'User');
          this.userEmail = user.email || '';
          this.userRole = user.role || '';
          
          this.fetchNotifications();
          // Polling every 30 seconds
          this.pollingSub = interval(30000).subscribe(() => this.fetchNotifications());
          
          // Click outside to close notifications
          document.addEventListener('click', () => {
            this.showNotifications = false;
          });
        } catch (e) {
          console.error('Error parsing user data', e);
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }
}
