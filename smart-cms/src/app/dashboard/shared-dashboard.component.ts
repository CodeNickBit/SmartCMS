import { Component, OnInit, PLATFORM_ID, Inject, OnDestroy } from '@angular/core'; // Added OnDestroy
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedSidebarComponent } from './components/sidebar/sidebar.component';
import { SharedHeaderComponent } from './components/header/header.component';
import { LeavePolicyService } from '../services/leave-policy.service';
import { AuthService } from '../services/auth.service';
import { ManagerService } from '../services/manager.service';
import { DepartmentService } from '../services/department.service';
import { DesignationService } from '../services/designation.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-shared-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] text-slate-800 light:text-[#0D1B35] dark:text-white font-sans overflow-hidden">
      <!-- Sidebar -->
      <app-shared-sidebar class="flex-shrink-0"></app-shared-sidebar>

      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Header -->
        <app-shared-header [notificationCount]="pendingCount"></app-shared-header> 

        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar">
          <div class="max-w-7xl mx-auto">
            <!-- Welcome Section -->
            <div class="mb-8">
              <h1 class="text-[#246bb6] light:text-[#1A6DC2] dark:text-[#3083DC]xl font-bold text-slate-800 light:text-[#0D1B35] dark:text-white tracking-tight">Dashboard Overview</h1>
              <p class="text-slate-500 light:text-[#7A96B2] dark:text-slate-400 mt-2 font-medium">Welcome back, {{ userName }}! Here's what's happening today.</p>
            </div>

            <!-- Return Digest Banner (Manager Only) -->
            <div *ngIf="userRole === 'manager' && digestVisible && digestItems.length > 0"
              class="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-900/10 overflow-hidden shadow-md">
              <div class="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-amber-500/10">
                <div class="flex items-center gap-3">
                  <span class="text-xl">📋</span>
                  <div>
                    <h3 class="font-bold text-slate-800 light:text-[#0D1B35] dark:text-white">Welcome Back! Here's What Happened While You Were Away</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">HR or a proxy manager actioned {{ digestItems.length }} leave request(s) on your behalf.</p>
                  </div>
                </div>
                <button (click)="dismissDigest()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-lg leading-none" title="Dismiss">&times;</button>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-amber-500/5 dark:bg-amber-900/10">
                    <tr class="text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th class="px-6 py-3">Employee</th>
                      <th class="px-6 py-3">Leave Type</th>
                      <th class="px-6 py-3">Dates</th>
                      <th class="px-6 py-3">Decision</th>
                      <th class="px-6 py-3">Actioned By</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of digestItems; let last = last"
                      [class]="'hover:bg-amber-500/5 transition-colors ' + (last ? '' : 'border-b border-amber-500/10')">
                      <td class="px-6 py-3 font-medium text-slate-800 dark:text-white">{{ item.employeeName }}</td>
                      <td class="px-6 py-3 text-slate-600 dark:text-slate-300">{{ item.leaveType }}</td>
                      <td class="px-6 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{{ item.startDate | date:'d MMM' }} – {{ item.endDate | date:'d MMM yy' }}</td>
                      <td class="px-6 py-3">
                        <span [class]="'px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ' + (item.status === \'Approved\' ? \'bg-emerald-500/20 text-emerald-500\' : \'bg-rose-500/20 text-rose-500\')">
                          {{ item.status }}
                        </span>
                      </td>
                      <td class="px-6 py-3 text-slate-500 dark:text-slate-400">{{ item.resolvedByName || 'HR / Proxy' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div *ngFor="let stat of stats" class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-xl p-6 shadow-lg relative overflow-hidden group hover:border-[#3083DC]/50 transition-all flex flex-col items-center justify-center">
                <div class="flex items-center justify-center space-x-4 mb-3">
                  <div [class]="'p-3 rounded-xl shadow-sm flex items-center justify-center ' + stat.bgClass + ' ' + stat.textClass">
                    <span [innerHTML]="stat.icon"></span>
                  </div>
                  <h3 class="text-3xl font-bold text-slate-800 light:text-[#0D1B35] dark:text-white">{{ stat.value }}</h3>
                </div>
                <div class="text-center">
                  <span class="text-xs font-bold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase tracking-widest">{{ stat.label }}</span>
                  <span *ngIf="stat.trend" [class]="'ml-2 text-xs font-bold ' + (stat.trendUp ? 'text-emerald-400' : 'text-rose-400')">
                    {{ stat.trendUp ? '↑' : '↓' }} {{ stat.trend }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Role Based Features -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- HR Section -->
              <div *ngIf="userRole === 'hr'" class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-xl shadow-lg overflow-hidden">
                <div class="p-6 border-b border-blue-900/20 flex items-center justify-between bg-white/5">
                  <h2 class="text-lg font-bold text-slate-800 light:text-[#0D1B35] dark:text-white flex items-center space-x-2">
                    <span class="h-2 w-2 bg-[#3083DC] rounded-full"></span>
                    <span>HR Management Quick Actions</span>
                  </h2>
                </div>
                <div class="p-8 grid grid-cols-2 gap-4">
                  <button routerLink="/dashboard/employees" class="p-4 rounded-xl bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 hover:border-[#3083DC]/50 hover:bg-[#3083DC]/10 transition-all group text-left">
                    <div class="h-10 w-10 rounded-lg bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 flex items-center justify-center mb-3 group-hover:text-[#3083DC] shadow-sm">
                      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    </div>
                    <p class="font-bold text-slate-800 light:text-[#0D1B35] dark:text-white text-sm">Manage Employees</p>
                    <p class="text-xs text-slate-500 light:text-[#7A96B2] dark:text-slate-400 mt-1">View & edit employees</p>
                  </button>
                  <button routerLink="/dashboard/leave-approvals" class="p-4 rounded-xl bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all group text-left">
                    <div class="h-10 w-10 rounded-lg bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 flex items-center justify-center mb-3 group-hover:text-emerald-400 shadow-sm">
                      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p class="font-bold text-slate-800 light:text-[#0D1B35] dark:text-white text-sm">Approvals</p>
                    <p class="text-xs text-slate-500 light:text-[#7A96B2] dark:text-slate-400 mt-1">Review pending requests</p>
                  </button>
                </div>
              </div>

              <!-- Manager Section -->
              <div *ngIf="userRole === 'manager'" class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-xl shadow-lg overflow-hidden">
                <div class="p-6 border-b border-blue-900/20 flex items-center justify-between bg-white/5">
                  <h2 class="text-lg font-bold text-slate-800 light:text-[#0D1B35] dark:text-white flex items-center space-x-2">
                    <span class="h-2 w-2 bg-emerald-500 rounded-full"></span>
                    <span>Team Overview</span>
                  </h2>
                </div>
                <div class="p-8">
                  <div class="space-y-4">
                    <div *ngFor="let member of team" class="flex items-center justify-between p-4 rounded-xl bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20">
                      <div class="flex items-center space-x-4">
                        <div class="h-10 w-10 rounded-lg bg-[#3083DC]/20 flex items-center justify-center text-[#3083DC] font-bold text-xs">
                          {{ member.name.charAt(0) }}
                        </div>
                        <div>
                          <p class="font-bold text-slate-800 light:text-[#0D1B35] dark:text-white text-sm">{{ member.name }}</p>
                          <p class="text-xs text-slate-500 light:text-[#7A96B2] dark:text-slate-400">{{ member.role }}</p>
                        </div>
                      </div>
                      <span [class]="'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ' + (member.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400')">
                        {{ member.status }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Announcements -->
              <div class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-xl shadow-lg overflow-hidden">
                <div class="p-6 border-b border-blue-900/20 flex items-center justify-between bg-white/5">
                  <h2 class="text-lg font-bold text-slate-800 light:text-[#0D1B35] dark:text-white flex items-center space-x-2">
                    <span class="h-2 w-2 bg-rose-500 rounded-full"></span>
                    <span>Recent Announcements</span>
                  </h2>
                </div>
                <div class="p-8 space-y-6">
                  <div *ngFor="let item of announcements" class="relative pl-6 border-l-2 border-blue-900/20 group">
                    <div class="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-slate-600 group-hover:bg-[#3083DC] transition-colors"></div>
                    <p class="text-xs font-bold text-[#3083DC] mb-1 uppercase tracking-widest">{{ item.date }}</p>
                    <h4 class="font-bold text-slate-800 light:text-[#0D1B35] dark:text-white text-sm mb-1">{{ item.title }}</h4>
                    <p class="text-xs text-slate-500 light:text-[#7A96B2] dark:text-slate-400 line-clamp-2 leading-relaxed">{{ item.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #1B264F; border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3083DC; }
    `]
})
export class SharedDashboardComponent implements OnInit, OnDestroy {
  userName: string = 'User';
  userRole: string = '';
  pendingCount: number = 0;
  digestItems: any[] = [];
  digestVisible = false;
  private pollingInterval: any;
  private digestDismissKey = '';

  stats: any[] = [];

  team = [
    { name: 'Alex Johnson', role: 'UI Developer', status: 'Active' },
    { name: 'Sarah Williams', role: 'UX Designer', status: 'In Meeting' },
    { name: 'Mike Brown', role: 'Backend Engineer', status: 'Active' },
  ];

  announcements = [
    { date: 'Jan 25, 2026', title: 'New Remote Work Policy', content: 'Updated guidelines for remote work and flexible hours have been posted to the employee handbook.' },
    { date: 'Jan 22, 2026', title: 'Quarterly Town Hall', content: 'Join us for the Q1 Town Hall meeting this Friday at 10:00 AM in the main auditorium or via Zoom.' },
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private leaveService: LeavePolicyService,
    private authService: AuthService,
    private managerService: ManagerService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.userName = user.name || (user.firstName ? `${user.firstName} ${user.lastName}` : 'User');
          this.userRole = user.role || '';

          if (this.userRole === 'manager' || this.userRole === 'hr') {
            this.loadPendingLeaves();
            this.loadDynamicStats();
            this.pollingInterval = setInterval(() => {
              this.loadPendingLeaves();
              this.loadDynamicStats();
            }, 30000);
          }

          if (this.userRole === 'manager') {
            const userId = user._id || user.id;
            this.digestDismissKey = `digest_dismissed_${userId}`;
            const dismissed = localStorage.getItem(this.digestDismissKey);
            if (!dismissed) {
              this.loadReturnDigest(userId);
            }
          }

        } catch (e) {
          console.error('Error parsing user data', e);
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  loadDynamicStats(): void {
    if (this.userRole === 'hr') {
      this.loadHRStats();
    } else if (this.userRole === 'manager') {
      this.loadManagerStats();
    }
  }

  private loadHRStats(): void {
    // 1. Total Employees
    this.authService.getUsers().subscribe({
      next: (users) => {
        const val = users ? users.length : 0;
        this.updateStat('Employees', val, 'bg-[#3083DC]', '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>');
      },
      error: () => this.updateStat('Employees', 0, 'bg-[#3083DC]', '')
    });

    // 2. Total Managers
    this.managerService.getActiveManagers().subscribe({
      next: (managers) => {
        const val = managers ? managers.length : 0;
        this.updateStat('Managers', val, 'bg-[#10B981]', '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>');
      },
      error: () => this.updateStat('Managers', 0, 'bg-[#10B981]', '')
    });

    // 3. Total Departments
    this.departmentService.getDepartments().subscribe({
      next: (deps) => {
        const val = deps ? deps.length : 0;
        this.updateStat('Departments', val, 'bg-rose-500', '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>');
      },
      error: () => this.updateStat('Departments', 0, 'bg-rose-500', '')
    });

    // 4. Total Designations
    this.designationService.getDesignations().subscribe({
      next: (desigs) => {
        const val = desigs ? desigs.length : 0;
        this.updateStat('Designations', val, 'bg-[#EE964B]', '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>');
      },
      error: () => this.updateStat('Designations', 0, 'bg-[#EE964B]', '')
    });
  }

  private loadManagerStats(): void {
    const user = this.authService.getUser();
    if (!user) return;
    const userId = user._id || user.id;
    const managerName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();

    // 1. Team Size
    this.authService.getUsers().subscribe({
      next: (users) => {
        const team = users.filter((u: any) => u.reportingManager === managerName);
        this.updateStat('Team Size', team.length, 'bg-[#3083DC]', '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>');
      },
      error: () => this.updateStat('Team Size', 0, 'bg-[#3083DC]', '')
    });

    // 2. Pending Approvals & 3. Team Members on Leave Today & 4. Lifetime Handled
    this.leaveService.getManagerLeaves(userId).subscribe({
      next: (leaves) => {
        const pending = leaves.filter((l: any) => l.status === 'Pending').length;
        this.updateStat('Approvals', pending, 'bg-[#EE964B]', '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>');

        const today = new Date();
        today.setHours(0,0,0,0);
        const onLeaveToday = leaves.filter((l: any) => {
          if (l.status !== 'Approved') return false;
          const start = new Date(l.startDate);
          start.setHours(0,0,0,0);
          const end = new Date(l.endDate);
          end.setHours(23,59,59,999);
          return today >= start && today <= end;
        }).length;
        this.updateStat('On Leave', onLeaveToday, 'bg-rose-500', '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>');

        const handled = leaves.filter((l: any) => l.status === 'Approved' || l.status === 'Rejected').length;
        this.updateStat('Processed', handled, 'bg-[#10B981]', '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>');
      },
      error: () => {
        this.updateStat('Approvals', 0, 'bg-[#EE964B]', '');
        this.updateStat('On Leave', 0, 'bg-rose-500', '');
        this.updateStat('Processed', 0, 'bg-[#10B981]', '');
      }
    });
  }

  private updateStat(label: string, value: number | string, bgClass: string, iconString: string): void {
    const icon = this.sanitizer.bypassSecurityTrustHtml(iconString);
    const existing = this.stats.find(s => s.label === label);
    if (existing) {
      existing.value = value;
      existing.icon = icon;
      existing.bgClass = bgClass;
    } else {
      this.stats.push({ label, value, bgClass, textClass: 'text-white', icon });
    }
    
    // Maintain strict sort order
    const hrOrder = ['Employees', 'Managers', 'Departments', 'Designations'];
    const mgrOrder = ['Team Size', 'Approvals', 'On Leave', 'Processed'];
    const order = this.userRole === 'hr' ? hrOrder : mgrOrder;
    
    this.stats.sort((a, b) => {
       const indexA = order.indexOf(a.label);
       const indexB = order.indexOf(b.label);
       if (indexA === -1) return 1;
       if (indexB === -1) return -1;
       return indexA - indexB;
    });
  }

  loadPendingLeaves(): void {
    const user = this.authService.getUser();
    if (!user) return;
    const userId = user._id || user.id;

    if (this.userRole === 'manager') {
      this.leaveService.getManagerLeaves(userId).subscribe({
        next: (data) => {
          this.pendingCount = (data || []).filter((l: any) => l.status === 'Pending').length;
        }
      });
    }
  }

  loadReturnDigest(userId: string): void {
    this.leaveService.getReturnDigest(userId).subscribe({
      next: (data) => {
        this.digestItems = data || [];
        this.digestVisible = this.digestItems.length > 0;
      },
      error: () => {}
    });
  }

  dismissDigest(): void {
    this.digestVisible = false;
    if (isPlatformBrowser(this.platformId) && this.digestDismissKey) {
      localStorage.setItem(this.digestDismissKey, 'true');
    }
  }
}
