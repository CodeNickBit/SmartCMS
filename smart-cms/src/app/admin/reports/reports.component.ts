import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeavePolicyService } from '../../services/leave-policy.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, AdminHeaderComponent],
  template: `
    <div class="flex h-screen bg-[#101935] text-white font-sans overflow-hidden">
      <app-admin-sidebar class="flex-shrink-0"></app-admin-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-admin-header title="Reports"></app-admin-header>

        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

          <!-- Controls -->
          <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-[#1B264F] p-5 rounded-2xl border border-blue-900/30">
            <div>
              <h2 class="text-xl font-bold text-white">Leave Analytics</h2>
              <p class="text-slate-400 text-sm mt-0.5">Aggregated leave analytics across the organization.</p>
            </div>
            <div class="flex gap-3 items-center">
              <div>
                <label class="block text-xs text-slate-400 mb-1">Year</label>
                <select [(ngModel)]="selectedYear" (change)="loadReport()"
                    class="bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option *ngFor="let y of years" [value]="y">{{ y }}</option>
                </select>
              </div>
              <button (click)="loadReport()" [disabled]="loading"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50 mt-5">
                Refresh
              </button>
            </div>
          </div>

          <div *ngIf="loading" class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div *ngFor="let i of [1,2,3,4]" class="h-28 bg-[#1B264F] rounded-2xl animate-pulse"></div>
          </div>

          <ng-container *ngIf="!loading && report">

            <!-- KPI Totals -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div *ngFor="let t of statusTotals"
                  class="bg-gradient-to-br from-[#1B264F] to-[#151f42] rounded-2xl border p-5"
                  [ngClass]="{
                    'border-amber-900/30': t.status === 'Pending',
                    'border-green-900/30': t.status === 'Approved',
                    'border-red-900/30': t.status === 'Rejected',
                    'border-purple-900/30': t.status === 'Cancelled'
                  }">
                <p class="text-xs text-slate-400 font-semibold mb-1">{{ t.status }}</p>
                <p class="text-3xl font-black"
                    [ngClass]="{
                      'text-amber-400': t.status === 'Pending',
                      'text-green-400': t.status === 'Approved',
                      'text-red-400': t.status === 'Rejected',
                      'text-purple-400': t.status === 'Cancelled'
                    }">{{ t.count }}</p>
                <p class="text-xs text-slate-500 mt-1">leave requests</p>
              </div>
            </div>

            <!-- Main Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <!-- Monthly Trend Bar Chart -->
              <div class="lg:col-span-2 bg-[#1B264F] rounded-2xl border border-blue-900/30 p-6 shadow-xl">
                <h3 class="font-bold text-slate-200 mb-6">Monthly Leave Volume — {{ selectedYear }}</h3>
                <div class="flex items-end gap-1.5 h-52">
                  <div *ngFor="let m of monthlyChart" class="flex-1 flex flex-col items-center group relative">
                    <div class="opacity-0 group-hover:opacity-100 absolute -top-14 bg-[#0D1B35] border border-blue-900/50 rounded-lg px-2.5 py-2 text-xs shadow-2xl z-10 transition-opacity pointer-events-none whitespace-nowrap">
                      <div class="font-bold text-white mb-0.5">{{ months[m.month - 1] }}</div>
                      <div><span class="text-green-400">✓ {{ m.approved }}</span> <span class="text-amber-400 ml-1">⏳ {{ m.pending }}</span></div>
                    </div>
                    <div class="w-full flex justify-center items-end h-full">
                      <div class="w-full max-w-[32px] flex flex-col-reverse gap-0.5 h-full items-center justify-start">
                        <div class="w-full rounded-sm bg-green-500/70 transition-all"
                            [style.height.%]="getBarPct(m.approved + m.pending)"></div>
                      </div>
                    </div>
                    <span class="text-[9px] text-slate-400 mt-1.5">{{ months[m.month - 1] }}</span>
                  </div>
                  <div *ngIf="monthlyChart.length === 0" class="w-full text-center text-slate-500 text-sm py-16">No data for {{ selectedYear }}</div>
                </div>
              </div>

              <!-- Department Breakdown -->
              <div class="bg-[#1B264F] rounded-2xl border border-blue-900/30 p-6 shadow-xl">
                <h3 class="font-bold text-slate-200 mb-5">By Department (Approved)</h3>
                <div class="space-y-3">
                  <div *ngFor="let d of report.deptSummary" class="space-y-1">
                    <div class="flex justify-between text-sm">
                      <span class="text-slate-300 truncate mr-2">{{ d._id || 'Unassigned' }}</span>
                      <span class="text-white font-bold flex-shrink-0">{{ d.totalApproved }}</span>
                    </div>
                    <div class="w-full bg-[#0D1B35] rounded-full h-2">
                      <div class="h-2 rounded-full bg-blue-500 transition-all"
                          [style.width.%]="(d.totalApproved / getMaxDept()) * 100"></div>
                    </div>
                  </div>
                  <p *ngIf="report.deptSummary.length === 0" class="text-slate-500 text-sm">No data</p>
                </div>
              </div>
            </div>

            <!-- Bottom Grid: Top Leave Takers + Type Breakdown -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <!-- Top Leave Takers -->
              <div class="bg-[#1B264F] rounded-2xl border border-blue-900/30 shadow-xl overflow-hidden">
                <div class="p-5 border-b border-blue-900/20">
                  <h3 class="font-bold text-slate-200">Top Leave Takers</h3>
                  <p class="text-xs text-slate-400 mt-0.5">Employees with most approved leaves in {{ selectedYear }}</p>
                </div>
                <div class="divide-y divide-blue-900/20">
                  <div *ngFor="let emp of report.topLeaveTakers; let i = index"
                      class="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
                    <div class="flex items-center gap-3">
                      <div class="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          [ngClass]="i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-500/20 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/10 text-blue-300'">
                        {{ i + 1 }}
                      </div>
                      <div>
                        <p class="text-sm font-semibold text-white">{{ emp.name || 'Unknown' }}</p>
                        <p class="text-xs text-slate-400">{{ emp.department }}</p>
                      </div>
                    </div>
                    <span class="text-lg font-black text-blue-400">{{ emp.totalLeaves }}</span>
                  </div>
                  <p *ngIf="report.topLeaveTakers.length === 0" class="px-5 py-6 text-slate-500 text-sm">No data</p>
                </div>
              </div>

              <!-- Leave Type Breakdown -->
              <div class="bg-[#1B264F] rounded-2xl border border-blue-900/30 shadow-xl overflow-hidden">
                <div class="p-5 border-b border-blue-900/20">
                  <h3 class="font-bold text-slate-200">Leave Type Breakdown</h3>
                  <p class="text-xs text-slate-400 mt-0.5">Requests by type and approval status</p>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead class="bg-[#0D1B35] text-xs uppercase text-slate-400 border-b border-blue-900/30">
                      <tr>
                        <th class="px-5 py-3 text-left">Leave Type</th>
                        <th class="px-5 py-3 text-center text-green-400">Approved</th>
                        <th class="px-5 py-3 text-center text-amber-400">Pending</th>
                        <th class="px-5 py-3 text-center text-red-400">Rejected</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-blue-900/20">
                      <tr *ngFor="let row of leaveTypeTable" class="hover:bg-white/3 transition-colors">
                        <td class="px-5 py-3 text-slate-300 font-medium">{{ row.type }}</td>
                        <td class="px-5 py-3 text-center text-green-400 font-mono">{{ row.approved }}</td>
                        <td class="px-5 py-3 text-center text-amber-400 font-mono">{{ row.pending }}</td>
                        <td class="px-5 py-3 text-center text-red-400 font-mono">{{ row.rejected }}</td>
                      </tr>
                      <tr *ngIf="leaveTypeTable.length === 0">
                        <td colspan="4" class="px-5 py-6 text-center text-slate-500 text-sm">No data</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </ng-container>

        </main>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  months = MONTHS;
  years: number[] = [];
  selectedYear = new Date().getFullYear();

  loading = false;
  report: any = null;

  statusTotals: any[] = [];
  leaveTypeTable: any[] = [];
  monthlyChart: any[] = [];

  constructor(private leaveService: LeavePolicyService) {
    const cur = new Date().getFullYear();
    for (let y = cur - 3; y <= cur; y++) this.years.push(y);
  }

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading = true;
    this.leaveService.getLeaveReport(this.selectedYear).subscribe({
      next: (data) => {
        this.report = data;
        this.processData(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load report', err);
        this.loading = false;
      }
    });
  }

  processData(data: any): void {
    // Status totals KPI
    const statusMap: Record<string, number> = {};
    for (const t of data.totals || []) {
      statusMap[t._id] = t.count;
    }
    this.statusTotals = ['Approved', 'Pending', 'Rejected', 'Cancelled'].map(s => ({
      status: s,
      count: statusMap[s] || 0
    }));

    // Leave type table
    const typeMap: Record<string, any> = {};
    for (const item of data.leaveTypeBreakdown || []) {
      const type = item._id.leaveType;
      const status = item._id.status;
      if (!typeMap[type]) typeMap[type] = { type, approved: 0, pending: 0, rejected: 0 };
      if (status === 'Approved') typeMap[type].approved += item.count;
      else if (status === 'Pending') typeMap[type].pending += item.count;
      else if (status === 'Rejected') typeMap[type].rejected += item.count;
    }
    this.leaveTypeTable = Object.values(typeMap);

    // Monthly trend chart
    const monthMap: Record<number, any> = {};
    for (let m = 1; m <= 12; m++) monthMap[m] = { month: m, approved: 0, pending: 0, rejected: 0 };
    for (const item of data.monthlyTrend || []) {
      const m = item._id.month;
      const s = item._id.status;
      if (!monthMap[m]) continue;
      if (s === 'Approved') monthMap[m].approved += item.count;
      else if (s === 'Pending') monthMap[m].pending += item.count;
      else if (s === 'Rejected') monthMap[m].rejected += item.count;
    }
    this.monthlyChart = Object.values(monthMap);
  }

  getMaxDept(): number {
    if (!this.report?.deptSummary?.length) return 1;
    return Math.max(...this.report.deptSummary.map((d: any) => d.totalApproved));
  }

  getMaxMonthly(): number {
    if (!this.monthlyChart.length) return 1;
    return Math.max(...this.monthlyChart.map(m => m.approved + m.pending + m.rejected));
  }

  getBarPct(val: number): number {
    const max = this.getMaxMonthly();
    if (!max) return 0;
    return Math.round((val / max) * 100);
  }
}
