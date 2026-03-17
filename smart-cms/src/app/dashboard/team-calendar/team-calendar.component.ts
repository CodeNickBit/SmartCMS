import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { LeavePolicyService } from '../../services/leave-policy.service';
import { SharedSidebarComponent } from '../components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-team-calendar',
  standalone: true,
  imports: [CommonModule, SharedSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] text-slate-800 light:text-[#0D1B35] dark:text-white font-sans overflow-hidden">
      <app-shared-sidebar class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header></app-shared-header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar">
          
          <div class="space-y-6">
             <!-- Header -->
            <div class="flex justify-between items-center bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] p-6 rounded-2xl border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30">
                <div>
                <h2 class="text-2xl font-bold text-slate-800 light:text-[#0D1B35] dark:text-white">Team Calendar</h2>
                <p class="text-slate-500 light:text-[#7A96B2] dark:text-slate-400">View your team's upcoming approved leaves</p>
                </div>
            </div>

            <!-- Calendar/List View -->
             <div class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-2xl overflow-hidden shadow-lg p-6">
                <div *ngIf="loading" class="text-center py-10 text-slate-500 light:text-[#7A96B2] dark:text-slate-400">Loading calendar...</div>
                
                <div *ngIf="!loading && teamLeaves.length === 0" class="text-center py-10 text-slate-500 italic">
                    No approved leaves found for your team.
                </div>

                <div *ngIf="!loading && teamLeaves.length > 0" class="space-y-4">
                    <div *ngFor="let leave of teamLeaves" class="flex items-center gap-4 p-4 rounded-xl bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20">
                         <div class="h-12 w-12 rounded-full bg-[#3083DC]/20 flex items-center justify-center text-[#3083DC] font-bold text-lg">
                            {{ (leave.userDetails?.firstName ?? 'U').charAt(0) }}
                         </div>
                         <div class="flex-1">
                             <h4 class="font-bold text-slate-800 light:text-[#0D1B35] dark:text-white">{{ leave.userDetails?.firstName }} {{ leave.userDetails?.lastName }}</h4>
                             <p class="text-sm text-slate-500 light:text-[#7A96B2] dark:text-slate-400">{{ leave.leaveType }} <span *ngIf="leave.leaveUnit === 'half-day'" class="text-xs bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded ml-2">Half Day ({{ leave.halfDayPeriod === 'first-half' ? 'AM' : 'PM' }})</span></p>
                         </div>
                         <div class="text-right">
                             <p class="text-base font-medium text-slate-800 light:text-[#0D1B35] dark:text-white">{{ leave.startDate | date:'mediumDate' }}</p>
                             <p class="text-xs text-slate-500" *ngIf="leave.leaveUnit !== 'half-day'">to {{ leave.endDate | date:'mediumDate' }}</p>
                         </div>
                    </div>
                </div>

             </div>
          </div>

        </main>
      </div>
    </div>
  `
})
export class TeamCalendarComponent implements OnInit {
  teamLeaves: any[] = [];
  loading = true;
  currentUser: any;

  constructor(
    private authService: AuthService,
    private leaveService: LeavePolicyService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    if (this.currentUser) {
      this.loadCalendar();
    }
  }

  loadCalendar(): void {
    this.loading = true;
    const managerId = this.currentUser._id ?? this.currentUser.id;
    this.leaveService.getTeamCalendar(managerId).subscribe({
      next: (data) => {
        this.teamLeaves = (data || []).map((l: any) => ({
          ...l,
          userDetails: l.userId // Populated in backend
        })).sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading calendar', err);
        this.loading = false;
      }
    });
  }
}
