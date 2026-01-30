import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeavePolicyService } from '../../services/leave-policy.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';
import { ConfirmationModalService } from '../../shared/confirmation-modal.service';

@Component({
  selector: 'app-year-end-processing',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent, AdminHeaderComponent],
  template: `
    <div class="flex h-screen bg-[#101935] text-white font-sans overflow-hidden">
        <!-- Sidebar -->
        <app-admin-sidebar class="flex-shrink-0"></app-admin-sidebar> 
        
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
            <app-admin-header></app-admin-header>
            
            <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar">
                
                <div class="space-y-6">
                    <!-- Header -->
                    <div class="flex justify-between items-center bg-[#1B264F] p-6 rounded-2xl border border-blue-900/30">
                        <div>
                            <h2 class="text-2xl font-bold text-white">Year-End Processing</h2>
                            <p class="text-slate-400">Review and finalize leave balances for {{ currentYear }}</p>
                        </div>
                        <button *ngIf="previewData && !processingComplete" (click)="confirmExecution()" 
                            class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            Execute Processing
                        </button>
                    </div>

                    <!-- Status / Result -->
                    <div *ngIf="processingComplete" class="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-xl flex items-start gap-4 animate-fade-in-up">
                        <div class="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-emerald-400">Processing Complete!</h3>
                            <p class="text-emerald-200/80 mt-1">Year-end calculations have been saved. Employees can now see their updated balances and carry-forward details.</p>
                        </div>
                    </div>

                    <!-- Preview Table -->
                    <div *ngIf="!processingComplete" class="bg-[#1B264F] border border-blue-900/30 rounded-2xl overflow-hidden shadow-lg">
                        <div class="p-6 border-b border-blue-900/20 flex justify-between items-center">
                            <h3 class="text-lg font-bold text-white">Projected Balances</h3>
                            <div class="text-sm text-slate-400">Previewing calculations for end of {{ currentYear }}</div>
                        </div>
                        
                        <div *ngIf="loading" class="p-8 text-center text-slate-400">Calculating preview...</div>
                        
                        <div *ngIf="!loading && previewData" class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-[#101935] text-xs uppercase text-slate-400 font-semibold border-b border-blue-900/30">
                                    <tr>
                                        <th class="px-6 py-4">Employee</th>
                                        <th class="px-6 py-4">Leave Type</th>
                                        <th class="px-6 py-4 text-center">Annual Limit</th>
                                        <th class="px-6 py-4 text-center">Used</th>
                                        <th class="px-6 py-4 text-center">Remaining</th>
                                        <th class="px-6 py-4 text-center bg-indigo-900/20 border-l border-blue-900/30">Carry Fwd</th>
                                        <th class="px-6 py-4 text-center bg-indigo-900/20">Encash</th>
                                        <th class="px-6 py-4 text-center bg-indigo-900/20 border-r border-blue-900/30">Lapse</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-blue-900/20">
                                    <ng-container *ngFor="let userResult of previewData.data">
                                        <tr *ngFor="let bal of userResult.balances; let i = index" class="hover:bg-white/5 transition-colors">
                                            <td class="px-6 py-4 font-medium text-white" *ngIf="i === 0" [attr.rowspan]="userResult.balances.length">
                                                {{ userResult.user.name }}
                                            </td>
                                            <td class="px-6 py-4 text-slate-300">{{ bal.leaveType }}</td>
                                            <td class="px-6 py-4 text-center text-slate-400">{{ bal.openingBalance }}</td>
                                            <td class="px-6 py-4 text-center text-amber-400 font-mono">{{ bal.used }}</td>
                                            <td class="px-6 py-4 text-center text-emerald-400 font-mono">{{ bal.closingBalance }}</td>
                                            
                                            <td class="px-6 py-4 text-center font-bold text-white bg-indigo-900/10 border-l border-blue-900/30">{{ bal.action.carryForward }}</td>
                                            <td class="px-6 py-4 text-center text-slate-300 bg-indigo-900/10">{{ bal.action.encashed }}</td>
                                            <td class="px-6 py-4 text-center text-rose-400 bg-indigo-900/10 border-r border-blue-900/30">{{ bal.action.lapsed }}</td>
                                        </tr>
                                    </ng-container>
                                </tbody>
                            </table>
                        </div>
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

  constructor(
    private leaveService: LeavePolicyService,
    private confirmationModal: ConfirmationModalService
  ) { }

  ngOnInit(): void {
    this.loadPreview();
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

  confirmExecution(): void {
    this.confirmationModal.confirm({
      title: 'Confirm Year-End Processing',
      message: `Are you sure you want to finalize leave balances for ${this.currentYear}? This action cannot be undone.`,
      confirmText: 'Execute Processing',
      type: 'warning'
    }).then(confirmed => {
      if (!confirmed) return;

      this.loading = true;
      this.leaveService.executeYearEnd(this.currentYear).subscribe({
        next: () => {
          this.loading = false;
          this.processingComplete = true;
          this.previewData = null; // Hide table
          this.confirmationModal.alert('Success', 'Year-end processing completed successfully!', 'success');
        },
        error: (err) => {
          console.error('Error executing', err);
          this.loading = false;
          this.confirmationModal.alert('Error', 'Failed to execute year-end processing', 'error');
        }
      });
    });
  }
}
