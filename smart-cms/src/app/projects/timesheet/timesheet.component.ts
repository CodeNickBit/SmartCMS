import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TimesheetService } from '../../services/timesheet.service';
import { AuthService } from '../../services/auth.service';
import { SharedSidebarComponent } from '../../dashboard/components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';
import { AdminSidebarComponent } from '../../admin/components/sidebar/sidebar.component';

const SCHEDULED_HOURS_PER_DAY = 8;

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, SharedSidebarComponent, AdminSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] text-slate-800 light:text-[#0D1B35] dark:text-white font-sans overflow-hidden">
      <app-admin-sidebar *ngIf="isAdmin" class="flex-shrink-0"></app-admin-sidebar>
      <app-shared-sidebar *ngIf="!isAdmin" class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header title="Employee Timesheet"></app-shared-header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935]">

          <div class="flex flex-col gap-6">

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 class="text-2xl font-bold text-white">Timesheet</h1>
                <p class="text-sm text-gray-400 mt-1" *ngIf="employeeName">{{ employeeName }}</p>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <div class="flex items-center gap-2">
                  <label class="text-sm text-gray-400 whitespace-nowrap">From</label>
                  <input
                    type="date"
                    [(ngModel)]="startDate"
                    (ngModelChange)="onDateChange()"
                    class="bg-[#1a2540] border border-[#2a3a5c] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <label class="text-sm text-gray-400 whitespace-nowrap">To</label>
                  <input
                    type="date"
                    [(ngModel)]="endDate"
                    (ngModelChange)="onDateChange()"
                    class="bg-[#1a2540] border border-[#2a3a5c] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div *ngIf="loading" class="flex flex-col items-center justify-center py-16 gap-4">
              <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-gray-400 text-sm">Loading timesheet...</p>
            </div>

            <ng-container *ngIf="!loading">

              <div *ngIf="summary" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="bg-[#1a2540] rounded-xl p-5 border border-[#2a3a5c] flex flex-col gap-1">
                  <span class="text-xs text-gray-400 uppercase tracking-wide">Total Hours</span>
                  <span class="text-3xl font-bold text-white">{{ summary.totalHours | number:'1.1-2' }}</span>
                </div>
                <div class="bg-[#1a2540] rounded-xl p-5 border border-[#2a3a5c] flex flex-col gap-1">
                  <span class="text-xs text-gray-400 uppercase tracking-wide">Billable Hours</span>
                  <span class="text-3xl font-bold text-green-400">{{ summary.billableHours | number:'1.1-2' }}</span>
                </div>
                <div class="bg-[#1a2540] rounded-xl p-5 border border-[#2a3a5c] flex flex-col gap-1">
                  <span class="text-xs text-gray-400 uppercase tracking-wide">Non-Billable Hours</span>
                  <span class="text-3xl font-bold text-yellow-400">{{ summary.nonBillableHours | number:'1.1-2' }}</span>
                </div>
              </div>

              <div *ngIf="logs.length === 0 && !loading" class="flex flex-col items-center justify-center py-16 gap-3">
                <span class="text-5xl">🗓️</span>
                <p class="text-gray-400 text-sm">No time logs found for the selected date range.</p>
              </div>

              <div *ngFor="let day of logs" class="flex flex-col gap-2">
                <div
                  class="flex items-center justify-between px-4 py-2 rounded-lg"
                  [ngClass]="isOverLimit(day) ? 'bg-red-900/40 border border-red-500/50' : 'bg-[#1a2540] border border-[#2a3a5c]'"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-semibold text-white">{{ formatDate(day.date) }}</span>
                    <span
                      *ngIf="isOverLimit(day)"
                      class="text-xs bg-red-500/20 text-red-400 border border-red-500/40 rounded-full px-2 py-0.5"
                    >Exceeds {{ scheduledHours }}h limit</span>
                  </div>
                  <span class="text-sm font-bold" [ngClass]="isOverLimit(day) ? 'text-red-400' : 'text-blue-400'">
                    {{ day.totalHours | number:'1.1-2' }}h
                  </span>
                </div>

                <div class="overflow-x-auto rounded-xl border border-[#2a3a5c]">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="bg-[#0f1c35] text-gray-400 text-xs uppercase tracking-wide">
                        <th class="px-4 py-3 text-left">Date</th>
                        <th class="px-4 py-3 text-left">Project</th>
                        <th class="px-4 py-3 text-left">Task</th>
                        <th class="px-4 py-3 text-right">Hours</th>
                        <th class="px-4 py-3 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        *ngFor="let entry of day.entries; let i = index"
                        class="border-t border-[#2a3a5c] transition-colors"
                        [ngClass]="i % 2 === 0 ? 'bg-[#1a2540]' : 'bg-[#162035]'"
                      >
                        <td class="px-4 py-3 text-gray-300 whitespace-nowrap">{{ formatDate(entry.date) }}</td>
                        <td class="px-4 py-3 text-gray-300">{{ entry.projectId || '—' }}</td>
                        <td class="px-4 py-3 text-gray-300">{{ entry.taskId || '—' }}</td>
                        <td class="px-4 py-3 text-right font-semibold text-blue-300">{{ entry.hours | number:'1.1-2' }}</td>
                        <td class="px-4 py-3 text-gray-400">{{ entry.description || '—' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </ng-container>

          </div>
        </main>
      </div>
    </div>
  `
})
export class TimesheetComponent implements OnInit {
  employeeId = '';
  employeeName = '';
  startDate = '';
  endDate = '';
  loading = false;
  logs: any[] = [];
  summary: { totalHours: number; billableHours: number; nonBillableHours: number } | null = null;
  scheduledHours = SCHEDULED_HOURS_PER_DAY;
  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private timesheetService: TimesheetService,
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const user = this.auth.getUser();
    this.isAdmin = user?.role?.toLowerCase() === 'admin';
    this.route.params.subscribe(params => {
      this.employeeId = params['employeeId'];
      this.loadTimesheet();
    });
  }

  onDateChange() {
    this.loadTimesheet();
  }

  loadTimesheet() {
    if (!this.employeeId) return;
    this.loading = true;
    this.logs = [];
    this.summary = null;
    this.timesheetService.getEmployeeTimesheet(
      this.employeeId,
      this.startDate || undefined,
      this.endDate || undefined
    ).subscribe({
      next: (res: any) => {
        this.employeeName = res.employeeName || '';
        this.logs = res.logs || [];
        this.summary = res.summary || null;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load timesheet data', 'Close', { duration: 4000 });
      }
    });
  }

  isOverLimit(day: any): boolean {
    return day.totalHours > this.scheduledHours;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
