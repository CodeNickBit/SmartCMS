import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeavePolicyService } from '../../services/leave-policy.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';
import { ConfirmationModalService } from '../../shared/confirmation-modal.service';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

@Component({
  selector: 'app-year-end-processing',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent, AdminHeaderComponent],
  template: `
    <div class="flex h-screen bg-[#101935] text-white font-sans overflow-hidden">
      <app-admin-sidebar class="flex-shrink-0"></app-admin-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-admin-header title="Year-End Processing"></app-admin-header>

        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

          <!-- What is Year-End Processing? -->
          <div class="bg-gradient-to-br from-indigo-900/30 to-blue-900/20 border border-indigo-700/30 rounded-2xl p-6">
            <h2 class="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              What does Year-End Processing do?
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div class="bg-[#0D1B35]/60 rounded-xl p-4 flex gap-3">
                <div class="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">1</div>
                <div>
                  <p class="font-semibold text-slate-200 mb-1">Calculates Final Balances</p>
                  <p class="text-slate-400">Counts all approved leaves used during {{ currentYear }} and computes the remaining balance for each leave type per employee.</p>
                </div>
              </div>
              <div class="bg-[#0D1B35]/60 rounded-xl p-4 flex gap-3">
                <div class="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">2</div>
                <div>
                  <p class="font-semibold text-slate-200 mb-1">Applies Policy Rules</p>
                  <p class="text-slate-400">Based on leave policy, remaining days are split into: <span class="text-white font-medium">Carry Forward</span> (rolled to next year), <span class="text-amber-400 font-medium">Encashed</span> (paid out), or <span class="text-rose-400 font-medium">Lapsed</span> (lost).</p>
                </div>
              </div>
              <div class="bg-[#0D1B35]/60 rounded-xl p-4 flex gap-3">
                <div class="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">3</div>
                <div>
                  <p class="font-semibold text-slate-200 mb-1">Saves a Permanent Record</p>
                  <p class="text-slate-400">A snapshot is saved permanently for audit purposes. Employees can view their year-end summaries in <strong class="text-white">My Leaves → Balance History</strong>.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Header + Action -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1B264F] p-6 rounded-2xl border border-blue-900/30 gap-4">
            <div>
              <h2 class="text-2xl font-bold text-white">Projected Year-End Balances</h2>
              <p class="text-slate-400 mt-1">Preview below before finalizing. Once executed, records are saved permanently.</p>
            </div>
            <div class="flex gap-3">
              <button (click)="loadPreview()" [disabled]="loading"
                  class="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh Preview
              </button>
              <button *ngIf="previewData && !processingComplete" (click)="confirmExecution()"
                  class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                Execute for {{ currentYear }}
              </button>
            </div>
          </div>

          <!-- Success Banner -->
          <div *ngIf="processingComplete" class="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-xl flex items-start gap-4">
            <div class="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-emerald-400">Processing Complete for {{ currentYear }}!</h3>
              <p class="text-emerald-200/80 mt-1 text-sm">Leave balances have been finalized and saved. Employees can now see their year-end summary under <strong>My Leaves → Balance History</strong>.</p>
              <p class="text-emerald-200/60 text-xs mt-2">Processed {{ executionResult?.processedCount || 0 }} employees.</p>
            </div>
          </div>

          <!-- Legend -->
          <div *ngIf="previewData && !processingComplete" class="flex flex-wrap gap-4 text-xs font-semibold">
            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-blue-500 inline-block"></span>Annual Limit (Opening)</span>
            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-amber-500 inline-block"></span>Used</span>
            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-emerald-500 inline-block"></span>Remaining</span>
            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-white inline-block"></span>Carry Forward → Next Year</span>
            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-yellow-500 inline-block"></span>Encashed (Paid Out)</span>
            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-rose-500 inline-block"></span>Lapsed (Forfeited)</span>
          </div>

          <!-- Loading Skeleton -->
          <div *ngIf="loading" class="space-y-3">
            <div *ngFor="let i of [1,2,3]" class="h-14 bg-[#1B264F] rounded-xl animate-pulse"></div>
          </div>

          <!-- Preview Table -->
          <div *ngIf="!loading && previewData && !processingComplete" class="bg-[#1B264F] border border-blue-900/30 rounded-2xl overflow-hidden shadow-lg">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-[#101935] text-xs uppercase text-slate-400 font-semibold border-b border-blue-900/30">
                  <tr>
                    <th class="px-5 py-4">Employee</th>
                    <th class="px-5 py-4">Leave Type</th>
                    <th class="px-5 py-4 text-center text-blue-400">Annual Limit</th>
                    <th class="px-5 py-4 text-center text-amber-400">Used</th>
                    <th class="px-5 py-4 text-center text-emerald-400">Remaining</th>
                    <th class="px-5 py-4 text-center bg-indigo-900/20 border-l border-blue-900/30 text-white">Carry Fwd →</th>
                    <th class="px-5 py-4 text-center bg-indigo-900/20 text-yellow-400">Encashed</th>
                    <th class="px-5 py-4 text-center bg-indigo-900/20 border-r border-blue-900/30 text-rose-400">Lapsed</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-blue-900/20">
                  <ng-container *ngFor="let userResult of previewData.data">
                    <tr *ngFor="let bal of userResult.balances; let i = index" class="hover:bg-white/3 transition-colors">
                      <td class="px-5 py-3 font-semibold text-white" *ngIf="i === 0" [attr.rowspan]="userResult.balances.length">
                        <div class="flex items-center gap-2">
                          <div class="h-7 w-7 rounded-full bg-blue-600/30 flex items-center justify-center text-xs font-bold text-blue-300">
                            {{ userResult.user.name.charAt(0) }}
                          </div>
                          {{ userResult.user.name }}
                        </div>
                      </td>
                      <td class="px-5 py-3 text-slate-300">{{ bal.leaveType }}</td>
                      <td class="px-5 py-3 text-center text-blue-400 font-mono font-medium">{{ bal.openingBalance }}</td>
                      <td class="px-5 py-3 text-center text-amber-400 font-mono font-medium">{{ bal.used }}</td>
                      <td class="px-5 py-3 text-center text-emerald-400 font-mono font-bold">{{ bal.closingBalance }}</td>
                      <td class="px-5 py-3 text-center text-white font-bold bg-indigo-900/10 border-l border-blue-900/30">{{ bal.action.carryForward }}</td>
                      <td class="px-5 py-3 text-center text-yellow-400 bg-indigo-900/10">{{ bal.action.encashed }}</td>
                      <td class="px-5 py-3 text-center bg-indigo-900/10 border-r border-blue-900/30">
                        <span [class.text-rose-400]="bal.action.lapsed > 0" [class.text-slate-500]="bal.action.lapsed === 0">
                          {{ bal.action.lapsed }}
                        </span>
                      </td>
                    </tr>
                  </ng-container>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Historical Records -->
          <div *ngIf="historicalRecords.length > 0" class="bg-[#1B264F] border border-blue-900/30 rounded-2xl overflow-hidden shadow-lg">
            <div class="p-5 border-b border-blue-900/20">
              <h3 class="font-bold text-slate-200">Previously Processed Years</h3>
              <p class="text-xs text-slate-400 mt-0.5">Records saved from past year-end executions.</p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="bg-[#101935] text-xs uppercase text-slate-400 border-b border-blue-900/30">
                  <tr>
                    <th class="px-5 py-3">Year</th>
                    <th class="px-5 py-3">Leave Type</th>
                    <th class="px-5 py-3 text-center">Opening</th>
                    <th class="px-5 py-3 text-center">Used</th>
                    <th class="px-5 py-3 text-center">Carry Fwd</th>
                    <th class="px-5 py-3 text-center">Encashed</th>
                    <th class="px-5 py-3 text-center">Lapsed</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-blue-900/20">
                  <tr *ngFor="let rec of historicalRecords" class="hover:bg-white/3">
                    <td class="px-5 py-3 font-bold text-indigo-300">{{ rec.year }}</td>
                    <td class="px-5 py-3 text-slate-300">{{ rec.leaveType }}</td>
                    <td class="px-5 py-3 text-center text-slate-400">{{ rec.openingBalance }}</td>
                    <td class="px-5 py-3 text-center text-amber-400">{{ rec.used }}</td>
                    <td class="px-5 py-3 text-center text-white font-bold">{{ rec.carryForward }}</td>
                    <td class="px-5 py-3 text-center text-yellow-400">{{ rec.encashed }}</td>
                    <td class="px-5 py-3 text-center text-rose-400">{{ rec.lapsed }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  `
})
export class YearEndProcessingComponent implements OnInit {
  currentYear = new Date().getFullYear();
  previewData: any = null;
  loading = true;
  processingComplete = false;
  executionResult: any = null;
  historicalRecords: any[] = [];

  constructor(
    private leaveService: LeavePolicyService,
    private confirmationModal: ConfirmationModalService
  ) { }

  ngOnInit(): void {
    this.loadPreview();
    this.loadHistoricalRecords();
  }

  loadPreview(): void {
    this.loading = true;
    this.leaveService.getYearEndPreview().subscribe({
      next: (data) => {
        this.previewData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading preview', err);
        this.loading = false;
        this.confirmationModal.alert('Error', 'Failed to load year-end preview', 'error');
      }
    });
  }

  loadHistoricalRecords(): void {
    // Fetch any already-saved balance records for all employees (admin view would need a dedicated endpoint,
    // for now we skip to avoid a heavy query — records are shown on employee side)
    this.historicalRecords = [];
  }

  confirmExecution(): void {
    this.confirmationModal.confirm({
      title: `Finalize ${this.currentYear} Leave Balances`,
      message: `This will permanently save the year-end leave balance snapshot for all employees for ${this.currentYear}. Carry forward, encashment, and lapsed days will be locked in. This cannot be undone.`,
      confirmText: 'Yes, Execute Processing',
      type: 'warning'
    }).then(confirmed => {
      if (!confirmed) return;

      this.loading = true;
      this.leaveService.executeYearEnd(this.currentYear).subscribe({
        next: (res) => {
          this.loading = false;
          this.processingComplete = true;
          this.executionResult = res;
          this.previewData = null;
        },
        error: (err) => {
          console.error('Error executing', err);
          this.loading = false;
          this.confirmationModal.alert('Error', err?.error?.message || 'Failed to execute year-end processing', 'error');
        }
      });
    });
  }
}
