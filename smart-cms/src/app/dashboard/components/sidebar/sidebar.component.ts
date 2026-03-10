import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProfileModalComponent } from '../profile-modal/profile-modal.component';

@Component({
  selector: 'app-shared-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ProfileModalComponent],
  template: `
    <div class="flex flex-col h-full bg-[#1B264F] text-slate-300 w-64 shrink-0 transition-all duration-300 relative z-20 shadow-xl border-r border-blue-900/30">
      <!-- Logo Section -->
      <div class="p-6 border-b border-blue-900/30">
        <div class="flex items-center justify-center">
          <img src="/assets/MEAN_Logo_Dark.png" alt="SmartCMS Logo" class="h-16 w-auto object-contain">
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
        <a routerLink="/dashboard" routerLinkActive="bg-white/5 text-white" [routerLinkActiveOptions]="{exact: true}"
          class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all">
          <svg class="h-5 w-5 group-hover:text-[#3083DC] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span class="font-medium text-sm">Overview</span>
        </a>

        <!-- Admin Specific Links -->
        <ng-container *ngIf="userRole === 'admin'">
          <div class="pt-4 pb-2 px-3">
             <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin</p>
          </div>
          <a routerLink="/dashboard/add-users" routerLinkActive="bg-white/5 text-white"
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all">
            <svg class="h-5 w-5 group-hover:text-[#3083DC] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span class="font-medium text-sm">Add User</span>
          </a>
          <a routerLink="/admin/policy" routerLinkActive="bg-white/5 text-white"
             class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all">
             <svg class="h-5 w-5 group-hover:text-[#3083DC] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
             <span class="font-medium text-sm">Leave Policy</span>
          </a>
          <a routerLink="/admin/year-end" routerLinkActive="bg-white/5 text-white"
             class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all">
             <svg class="h-5 w-5 group-hover:text-[#3083DC] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
             <span class="font-medium text-sm">Year-End Processing</span>
          </a>
        </ng-container>

        <!-- HR Specific Links -->
        <ng-container *ngIf="userRole === 'hr'">
          <div class="pt-4 pb-2 px-3">
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Management</p>
          </div>
          <a routerLink="/dashboard/manage-managers" routerLinkActive="bg-white/5 text-white"
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all">
            <svg class="h-5 w-5 group-hover:text-[#3083DC] transition-colors" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="font-medium text-sm">Manage Managers</span>
          </a>
          <a routerLink="/dashboard/employees" routerLinkActive="bg-white/5 text-white"
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all">
            <svg class="h-5 w-5 group-hover:text-[#3083DC] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span class="font-medium text-sm">Employees</span>
          </a>
          <a routerLink="/dashboard/attendance" routerLinkActive="bg-white/5 text-white"
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all">
            <svg class="h-5 w-5 group-hover:text-[#3083DC] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span class="font-medium text-sm">Attendance</span>
          </a>
        </ng-container>

        <!-- Manager Specific Links -->
        <ng-container *ngIf="userRole === 'manager'">
          <div class="pt-4 pb-2 px-3">
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Team</p>
          </div>
          <!-- Leave Approvals -->
          <a routerLink="/dashboard/leave-approvals" routerLinkActive="bg-white/5 text-white"
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all">
            <svg class="h-5 w-5 group-hover:text-[#3083DC] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-medium text-sm">Leave Approvals</span>
          </a>
          <!-- Attendance Approvals -->
          <a routerLink="/dashboard/manager-approvals" routerLinkActive="bg-white/5 text-white"
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all">
            <svg class="h-5 w-5 group-hover:text-[#3083DC] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span class="font-medium text-sm">Attendance Approvals</span>
          </a>
          <!-- Team Calendar -->
          <a routerLink="/dashboard/team-calendar" routerLinkActive="bg-white/5 text-white"
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all">
            <svg class="h-5 w-5 group-hover:text-[#3083DC] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="font-medium text-sm">Team Calendar</span>
          </a>
          <a routerLink="/dashboard/my-team" routerLinkActive="bg-white/5 text-white" [routerLinkActiveOptions]="{exact: true}"
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all">
            <svg class="h-5 w-5 group-hover:text-[#3083DC] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="font-medium text-sm">My Team</span>
          </a>

        </ng-container>

        <!-- Common Links -->
        <div class="pt-4 pb-2 px-3">
          <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Settings</p>
        </div>
        <button (click)="openProfile()"
          class="w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all text-left">
          <svg class="h-5 w-5 group-hover:text-[#3083DC] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="font-medium text-sm">My Profile</span>
        </button>
      </nav>

      <!-- User Profile Section -->
      <div class="p-4 border-t border-blue-900/30">
        <div class="flex items-center gap-3 p-2 rounded-xl bg-[#101935]/50 border border-blue-900/20">
          <div class="h-10 w-10 rounded-lg bg-[#3083DC]/20 flex items-center justify-center text-[#3083DC] font-bold border border-[#3083DC]/30">
            {{ userName.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-white truncate">{{ userName }}</p>
            <p class="text-[10px] font-bold text-[#3083DC] uppercase tracking-wider">{{ userRole }}</p>
          </div>
        </div>
        <button (click)="logout()"
          class="w-full mt-4 flex items-center justify-center gap-2 p-2.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-medium text-sm border border-rose-500/20">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>

    <!-- Profile Modal -->
    <app-profile-modal
      *ngIf="showProfileModal"
      [user]="currentUser"
      (close)="closeProfile()">
    </app-profile-modal>
  `,
  styles: [`
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #101935; border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3083DC; }
    `]
})
export class SharedSidebarComponent implements OnInit {
  userName: string = 'User';
  userRole: string = '';
  currentUser: any = null;
  showProfileModal: boolean = false;

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
          this.currentUser = user; // Store full object for modal
          this.userName = user.name || (user.firstName ? `${user.firstName} ${user.lastName}` : 'User');
          this.userRole = user.role || '';
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

  openProfile() {
    this.showProfileModal = true;
  }

  closeProfile() {
    this.showProfileModal = false;
  }
}
