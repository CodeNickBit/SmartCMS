import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { LeavePolicyService } from '../../services/leave-policy.service';
import { SharedSidebarComponent } from '../components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../components/header/header.component';

interface CalendarPerson {
  name: string;
  initials: string;
  isManager: boolean;
  leaves: { start: Date; end: Date; type: string }[];
}

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
            <div class="flex flex-wrap gap-4 justify-between items-center bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] p-6 rounded-2xl border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30">
              <div>
                <h2 class="text-2xl font-bold text-slate-800 light:text-[#0D1B35] dark:text-white">Team Calendar</h2>
                <p class="text-slate-500 light:text-[#7A96B2] dark:text-slate-400 text-sm mt-1">Approved leaves across your team — {{ monthName }} {{ currentYear }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button (click)="prevMonth()" class="h-9 w-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-[#101935] hover:bg-[#3083DC]/20 text-slate-500 dark:text-slate-300 hover:text-[#3083DC] border border-slate-200 dark:border-blue-900/30 transition-all">&#8249;</button>
                <span class="px-4 py-1.5 rounded-xl bg-[#3083DC]/10 text-[#3083DC] font-bold text-sm min-w-[140px] text-center">{{ monthName }} {{ currentYear }}</span>
                <button (click)="nextMonth()" class="h-9 w-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-[#101935] hover:bg-[#3083DC]/20 text-slate-500 dark:text-slate-300 hover:text-[#3083DC] border border-slate-200 dark:border-blue-900/30 transition-all">&#8250;</button>
              </div>
            </div>

            <!-- Loading -->
            <div *ngIf="loading" class="text-center py-20 text-slate-500">
              <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#3083DC] border-r-transparent mb-3"></div>
              <p class="text-sm">Loading calendar…</p>
            </div>

            <!-- Calendar Grid -->
            <div *ngIf="!loading" class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-2xl overflow-auto shadow-lg">
              <table class="w-full border-collapse min-w-max">
                <thead>
                  <tr class="border-b border-slate-200 dark:border-blue-900/30">
                    <th class="sticky left-0 z-10 bg-white dark:bg-[#1B264F] px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 min-w-[180px]">Member</th>
                    <th *ngFor="let d of dayNumbers" class="px-0 py-3 text-center text-[11px] font-bold w-8"
                      [class]="isWeekend(d) ? 'text-rose-400 bg-rose-50/50 dark:bg-rose-900/10' : 'text-slate-400'">
                      {{ d }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngIf="people.length === 0">
                    <td [attr.colspan]="daysInMonth + 1" class="py-16 text-center text-slate-500 italic text-sm">No team members found.</td>
                  </tr>
                  <tr *ngFor="let person of people"
                    class="border-b last:border-0 border-slate-100 dark:border-blue-900/20 hover:bg-slate-50/40 dark:hover:bg-white/5 transition-colors">
                    <td class="sticky left-0 z-10 bg-white dark:bg-[#1B264F] hover:bg-slate-50/40 dark:hover:bg-[#1B264F] px-4 py-2.5 border-r border-slate-100 dark:border-blue-900/20">
                      <div class="flex items-center gap-2.5">
                        <div [class]="'h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ' + (person.isManager ? 'bg-indigo-500' : 'bg-[#3083DC]')">
                          {{ person.initials }}
                        </div>
                        <div class="min-w-0">
                          <p class="font-semibold text-slate-800 dark:text-white text-sm truncate max-w-[120px]">{{ person.name }}</p>
                          <p *ngIf="person.isManager" class="text-[10px] text-indigo-400 font-bold uppercase tracking-wide">You</p>
                        </div>
                      </div>
                    </td>
                    <td *ngFor="let d of dayNumbers" class="relative p-0.5 w-8"
                      [class]="isWeekend(d) ? 'bg-rose-50/30 dark:bg-rose-900/5' : ''">
                      <div *ngIf="getLeaveOnDay(person, d) as lv"
                        [title]="lv.type"
                        [class]="'h-6 w-full rounded-sm ' + (person.isManager ? 'bg-indigo-500/75' : 'bg-[#3083DC]/70')">
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Legend -->
            <div *ngIf="!loading" class="flex flex-wrap items-center gap-6 px-2">
              <div class="flex items-center gap-2">
                <span class="h-3 w-6 rounded-sm bg-[#3083DC]/70"></span>
                <span class="text-xs text-slate-500 dark:text-slate-400">Team member on leave</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="h-3 w-6 rounded-sm bg-indigo-500/75"></span>
                <span class="text-xs text-slate-500 dark:text-slate-400">Your leave (manager)</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="h-3 w-6 rounded-sm bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/30"></span>
                <span class="text-xs text-slate-500 dark:text-slate-400">Weekend</span>
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
export class TeamCalendarComponent implements OnInit {
  people: CalendarPerson[] = [];
  loading = true;
  currentUser: any;
  currentMonth: number;
  currentYear: number;

  readonly MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  constructor(
    private authService: AuthService,
    private leaveService: LeavePolicyService
  ) {
    const now = new Date();
    this.currentMonth = now.getMonth();
    this.currentYear = now.getFullYear();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    if (this.currentUser) this.loadCalendar();
  }

  get monthName(): string { return this.MONTHS[this.currentMonth]; }
  get daysInMonth(): number { return new Date(this.currentYear, this.currentMonth + 1, 0).getDate(); }
  get dayNumbers(): number[] { return Array.from({ length: this.daysInMonth }, (_, i) => i + 1); }

  prevMonth(): void {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else this.currentMonth--;
  }

  nextMonth(): void {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else this.currentMonth++;
  }

  isWeekend(day: number): boolean {
    const dow = new Date(this.currentYear, this.currentMonth, day).getDay();
    return dow === 0 || dow === 6;
  }

  getLeaveOnDay(person: CalendarPerson, day: number): { type: string } | null {
    const d = new Date(this.currentYear, this.currentMonth, day);
    d.setHours(12, 0, 0, 0);
    for (const leave of person.leaves) {
      const s = new Date(leave.start); s.setHours(0, 0, 0, 0);
      const e = new Date(leave.end); e.setHours(23, 59, 59, 999);
      if (d >= s && d <= e) return { type: leave.type };
    }
    return null;
  }

  loadCalendar(): void {
    this.loading = true;
    const managerId = this.currentUser._id ?? this.currentUser.id;
    this.leaveService.getTeamCalendar(managerId).subscribe({
      next: (data) => {
        const map = new Map<string, CalendarPerson>();

        (data || []).forEach((l: any) => {
          const isManager = !!l.isManagerLeave;
          let name: string;
          let id: string;

          if (isManager) {
            name = l.managerName || 'Manager';
            id = '__manager__';
          } else {
            const u = l.userId;
            name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'Unknown';
            id = u?._id || u?.id || name;
          }

          if (!map.has(id)) {
            const parts = name.split(' ');
            const initials = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
            map.set(id, { name, initials, isManager, leaves: [] });
          }

          map.get(id)!.leaves.push({
            start: new Date(l.startDate),
            end: new Date(l.endDate),
            type: l.leaveType
          });
        });

        const all = Array.from(map.values());
        this.people = [
          ...all.filter(p => p.isManager),
          ...all.filter(p => !p.isManager).sort((a, b) => a.name.localeCompare(b.name))
        ];

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading calendar', err);
        this.loading = false;
      }
    });
  }
}
