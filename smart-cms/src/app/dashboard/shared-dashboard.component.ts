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
import { ProjectService } from '../services/project.service';
import { TaskService } from '../services/task.service';
import { DashboardService } from '../services/dashboard.service';
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
              <h1 class="text-2xl font-bold text-slate-800 light:text-[#0D1B35] dark:text-white tracking-tight">Dashboard Overview</h1>
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
              
              <!-- SECTION: HR SPECIFIC VIEW -->
              <ng-container *ngIf="userRole === 'hr'">
                <!-- Widget 1: HR Management Quick Actions & Pulse -->
                <div class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-xl shadow-lg overflow-hidden flex flex-col">
                  <div class="p-6 border-b border-blue-900/20 flex items-center justify-between bg-white/5">
                    <h2 class="text-lg font-bold text-slate-800 light:text-[#0D1B35] dark:text-white flex items-center space-x-2">
                      <span class="h-2 w-2 bg-[#3083DC] rounded-full"></span>
                      <span>HR Management Quick Actions & Pulse</span>
                    </h2>
                  </div>
                  <div class="p-8 flex-1 flex flex-col">
                    <!-- Attendance Pulse Gauge -->
                    <div class="mb-8 p-6 rounded-2xl bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 relative overflow-hidden group">
                      <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <svg class="h-20 w-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      </div>
                      
                      <div class="flex items-center justify-between mb-4">
                        <div>
                          <p class="text-[10px] font-bold text-[#3083DC] uppercase tracking-widest mb-1">Daily Capacity Pulse</p>
                          <h3 class="text-2xl font-black text-slate-800 dark:text-white">{{ hrPulseData?.pulsePercentage || 0 }}%</h3>
                        </div>
                        <div class="text-right">
                          <span [class]="'px-2 py-1 rounded-full text-[10px] font-bold uppercase ' + (hrPulseData?.pulsePercentage > 80 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500')">
                            {{ hrPulseData?.pulsePercentage > 80 ? 'Healthy' : 'Average' }}
                          </span>
                        </div>
                      </div>

                      <div class="h-3 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden mb-4">
                        <div class="h-full bg-gradient-to-r from-[#3083DC] to-emerald-400 transition-all duration-1000 ease-out" [style.width.%]="hrPulseData?.pulsePercentage || 0"></div>
                      </div>

                      <div class="grid grid-cols-3 gap-2">
                         <div class="text-center">
                           <p class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Present</p>
                           <p class="text-sm font-bold text-slate-800 dark:text-white">{{ hrPulseData?.presentToday || 0 }}</p>
                         </div>
                         <div class="text-center border-x border-slate-200 dark:border-white/5">
                           <p class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">On Leave</p>
                           <p class="text-sm font-bold text-slate-800 dark:text-white">{{ hrPulseData?.onLeaveToday || 0 }}</p>
                         </div>
                         <div class="text-center">
                           <p class="text-[9px] font-bold text-rose-500 uppercase">Missing</p>
                           <p class="text-sm font-bold text-rose-500">{{ hrPulseData?.absentToday || 0 }}</p>
                         </div>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <button routerLink="/dashboard/employees" class="p-4 rounded-xl bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 hover:border-[#3083DC]/50 hover:bg-[#3083DC]/10 transition-all group text-left">
                        <div class="h-10 w-10 rounded-lg bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 flex items-center justify-center mb-3 group-hover:text-[#3083DC] shadow-sm">
                          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        </div>
                        <p class="font-bold text-slate-800 light:text-[#0D1B35] dark:text-white text-sm">Manage Employees</p>
                      </button>
                      <button routerLink="/dashboard/leave-approvals" class="p-4 rounded-xl bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all group text-left">
                        <div class="h-10 w-10 rounded-lg bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 flex items-center justify-center mb-3 group-hover:text-emerald-400 shadow-sm">
                          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p class="font-bold text-slate-800 light:text-[#0D1B35] dark:text-white text-sm">Approvals</p>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Widget 2: Hiring & Growth Highlights -->
                <div class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-xl shadow-lg overflow-hidden flex flex-col">
                  <div class="p-6 border-b border-blue-900/20 flex items-center justify-between bg-white/5">
                    <h2 class="text-lg font-bold text-slate-800 light:text-[#0D1B35] dark:text-white flex items-center space-x-2">
                      <span class="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span>Hiring & Growth Highlights</span>
                    </h2>
                  </div>
                  <div class="p-8 flex-1 space-y-8">
                    <!-- Celebrations Section -->
                    <div class="space-y-4">
                      <h4 class="text-[10px] font-bold text-[#3083DC] uppercase tracking-widest flex items-center justify-between">
                        <span>Workforce Heartbeat</span>
                        <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 animate-bounce">🎂</span>
                      </h4>
                      <div *ngIf="hrPulseData?.celebrations?.length > 0; else noCelebrations" class="space-y-3">
                         <div *ngFor="let c of hrPulseData.celebrations" class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#101935] border border-white/5">
                            <div class="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 shadow-inner">
                               {{ c.type === 'birthday' ? '🎂' : '🎗️' }}
                            </div>
                            <div>
                               <p class="text-xs font-bold text-slate-800 dark:text-white">{{ c.name }}</p>
                               <p class="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{{ c.type === 'birthday' ? "Today's Birthday" : "Work Anniversary" }} • {{ c.department }}</p>
                            </div>
                         </div>
                      </div>
                      <ng-template #noCelebrations>
                         <p class="text-[11px] text-slate-500 italic">No celebrations for today.</p>
                      </ng-template>
                    </div>

                    <!-- New Joinees Section -->
                    <div class="space-y-4">
                       <h4 class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Recent Onboarding</h4>
                       <div *ngIf="hrPulseData?.newJoinees?.length > 0; else noNewHires" class="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                          <div *ngFor="let hire of hrPulseData.newJoinees.slice(0, 2)" class="p-3 rounded-xl bg-slate-50 dark:bg-[#101935] border border-white/5 flex items-center justify-between group">
                             <div class="flex items-center gap-3">
                                <div class="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs">
                                   {{ hire.name.charAt(0) }}
                                </div>
                                <div>
                                   <h4 class="text-xs font-bold text-slate-800 dark:text-white">{{ hire.name }}</h4>
                                   <p class="text-[9px] text-slate-500 font-bold tracking-tight">{{ hire.department }}</p>
                                </div>
                             </div>
                             <span class="text-[9px] font-bold text-slate-500 px-2 py-1 bg-white dark:bg-black/20 rounded shadow-sm">Joined {{ hire.joiningDate | date:'MMM d' }}</span>
                          </div>
                       </div>
                       <ng-template #noNewHires>
                          <p class="text-[11px] text-slate-500 italic">No recent hires detected.</p>
                       </ng-template>
                    </div>

                    <!-- Availability Summary -->
                    <div class="pt-4 border-t border-slate-200 dark:border-white/5">
                       <h4 class="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3">Availability Snapshot</h4>
                       <div class="flex items-center gap-2 flex-wrap">
                          <span *ngIf="hrPulseData?.onLeaveToday === 0" class="text-[11px] text-slate-500 italic">Full house today! 🚀</span>
                          <span *ngFor="let person of hrPulseData?.onLeaveNames" class="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-medium text-amber-600">
                             {{ person.name }} (OOO)
                          </span>
                       </div>
                    </div>
                  </div>
                </div>
              </ng-container>

              <!-- SECTION: MANAGER SPECIFIC VIEW -->
              <ng-container *ngIf="userRole === 'manager'">
                <!-- Widget 1: Latest Project Progression -->
                <div class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-xl shadow-lg overflow-hidden flex flex-col">
                  <div class="p-6 border-b border-blue-900/20 flex items-center justify-between bg-white/5">
                    <h2 class="text-lg font-bold text-slate-800 light:text-[#0D1B35] dark:text-white flex items-center space-x-2">
                      <span class="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span>Latest Project Progression</span>
                    </h2>
                  </div>
                  <div class="p-8 flex-1">
                    <div *ngIf="recentProjects.length > 0; else noProjects" class="space-y-6">
                      <div *ngFor="let project of recentProjects" class="p-5 rounded-xl bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 hover:border-[#3083DC]/40 transition-all group">
                        <div class="flex items-center justify-between mb-3">
                          <div>
                            <h4 class="font-bold text-slate-800 light:text-[#0D1B35] dark:text-white text-sm group-hover:text-[#3083DC] transition-colors">{{ project.title }}</h4>
                            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              {{ project.statusLabel }} • {{ project.priority }}
                            </span>
                          </div>
                          <div class="text-right">
                            <span class="text-sm font-bold text-[#3083DC]">{{ project.progress }}%</span>
                          </div>
                        </div>
                        <div class="h-2 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                          <div [class]="'h-full transition-all duration-1000 ease-out rounded-full ' + project.progressColor" [style.width.%]="project.progress"></div>
                        </div>

                        <!-- Task Stats Grid -->
                        <div class="grid grid-cols-2 gap-4 mt-5">
                          <div class="p-3 rounded-xl bg-slate-900/20 dark:bg-black/20 border border-white/5 shadow-inner">
                            <p class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Tasks</p>
                            <p class="text-xl font-bold text-slate-800 dark:text-white">{{ project.taskStats?.total || 0 }}</p>
                          </div>
                          <div class="p-3 rounded-xl bg-slate-900/20 dark:bg-black/20 border border-white/5 shadow-inner">
                            <p class="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Completed</p>
                            <p class="text-xl font-bold text-emerald-500">{{ project.taskStats?.done || 0 }}</p>
                          </div>
                        </div>
                      </div>
                      <div class="mt-6 pt-4 border-t border-slate-200 dark:border-white/5">
                        <a routerLink="/dashboard/projects" class="text-xs font-bold text-[#3083DC] hover:text-[#3083DC]/80 transition-colors flex items-center gap-1 group/link">
                          View all projects 
                          <svg class="h-3 w-3 transform group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                        </a>
                      </div>
                    </div>
                    <ng-template #noProjects>
                      <p class="text-slate-500 italic text-center py-8">No recent project activity.</p>
                    </ng-template>
                  </div>
                </div>

                <!-- Widget 2: Upcoming Deadlines & Milestones -->
                <div class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-xl shadow-lg overflow-hidden flex flex-col">
                  <div class="p-6 border-b border-blue-900/20 flex items-center justify-between bg-white/5">
                    <h2 class="text-lg font-bold text-slate-800 light:text-[#0D1B35] dark:text-white flex items-center space-x-2">
                      <span class="h-2 w-2 bg-rose-500 rounded-full animate-pulse"></span>
                      <span>Upcoming Deadlines & Milestones</span>
                    </h2>
                  </div>
                  <div class="p-8 flex-1 overflow-y-auto custom-scrollbar" style="max-height: 400px;">
                    <div *ngIf="upcomingDeadlines.length > 0; else noDeadlines" class="space-y-6">
                      <div *ngFor="let item of upcomingDeadlines" class="relative pl-6 border-l-2 border-blue-900/20 group">
                        <div [class]="'absolute -left-[5px] top-0 h-2 w-2 rounded-full ' + (item.isUrgent ? 'bg-rose-500 animate-ping' : 'bg-[#3083DC]')"></div>
                        <p class="text-[10px] font-bold uppercase tracking-widest text-[#3083DC]">{{ item.formattedDate }}</p>
                        <h4 class="font-bold text-sm text-slate-800 dark:text-white mb-1 italic line-clamp-1 hover:text-[#3083DC] transition-colors cursor-default">{{ item.title }}</h4>
                        <p class="text-[10px] text-slate-500">Project: {{ item.project?.title || 'General' }}</p>
                      </div>
                    </div>
                    <ng-template #noDeadlines>
                      <p class="text-slate-500 italic text-center py-8">No upcoming deadlines.</p>
                    </ng-template>
                  </div>
                </div>
              </ng-container>
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
  recentProjects: any[] = [];
  upcomingDeadlines: any[] = [];
  hrPulseData: any = null;



  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private leaveService: LeavePolicyService,
    private authService: AuthService,
    private managerService: ManagerService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private dashboardService: DashboardService,
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
              if (this.userRole === 'hr') {
                this.loadHRPulse();
              } else {
                this.loadRecentProjects();
                this.loadUpcomingDeadlines();
              }
              
              this.pollingInterval = setInterval(() => {
                this.loadPendingLeaves();
                this.loadDynamicStats();
                if (this.userRole === 'hr') {
                  this.loadHRPulse();
                } else {
                  this.loadRecentProjects();
                  this.loadUpcomingDeadlines();
                }
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

  loadHRPulse(): void {
    this.dashboardService.getHRPulse().subscribe({
      next: (data) => {
        this.hrPulseData = data;
      },
      error: (err) => console.error('Error loading HR pulse', err)
    });
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  loadUpcomingDeadlines(): void {
    this.taskService.getMyTasks({ status: 'todo,in_progress,in_review,blocked' }).subscribe({
      next: (tasks) => {
        this.upcomingDeadlines = (tasks || [])
          .filter(t => t.dueDate)
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, 5)
          .map(t => ({
            ...t,
            formattedDate: this.formatDueDate(t.dueDate),
            isUrgent: this.checkUrgency(t.dueDate)
          }));
      },
      error: (err) => console.error('Error loading deadlines', err)
    });
  }

  private formatDueDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    const taskDate = new Date(d);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === now.getTime()) return 'Today';
    if (taskDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private checkUrgency(date: string): boolean {
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days <= 2; // Urgent if within 2 days
  }

  loadRecentProjects(): void {
    this.projectService.getAll().subscribe({
      next: (projects) => {
        this.recentProjects = (projects || []).slice(0, 3).map(p => {
          const totalTasks = p.taskStats?.total || 0;
          const completedTasks = p.taskStats?.done || 0;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          
          return {
            ...p,
            progress,
            progressColor: this.getProgressColor(progress),
            statusLabel: this.formatStatus(p.status)
          };
        });
      },
      error: (err) => console.error('Error loading projects', err)
    });
  }

  private getProgressColor(progress: number): string {
    if (progress >= 100) return 'bg-emerald-500';
    if (progress >= 70) return 'bg-[#3083DC]';
    if (progress >= 30) return 'bg-amber-500';
    return 'bg-rose-500';
  }

  private formatStatus(status: string): string {
    if (!status) return 'Unknown';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
