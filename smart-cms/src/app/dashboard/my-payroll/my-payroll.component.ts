import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PayrollService, Payslip } from '../../services/payroll.service';
import { SharedHeaderComponent } from '../components/header/header.component';
import { SharedSidebarComponent } from '../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

@Component({
  selector: 'app-my-payroll',
  standalone: true,
  imports: [CommonModule, SharedHeaderComponent, SharedSidebarComponent],
  template: `
    <div class="flex h-screen bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] text-slate-800 light:text-[#0D1B35] dark:text-white font-sans overflow-hidden">
      <app-shared-sidebar *ngIf="!isAdmin && userRole !== 'employee'" class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header title="My Payslips"></app-shared-header>

        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] custom-scrollbar">

          <div class="flex justify-between items-center">
            <div>
              <button *ngIf="userRole === 'employee'" class="mb-6 px-4 py-2 bg-[#3083DC]/10 text-[#3083DC] hover:bg-[#3083DC]/20 border border-[#3083DC]/30 rounded-lg text-sm font-medium transition-colors" (click)="router.navigate(['/home'])">
                ← Back to Dashboard
              </button>
              <h1 class="text-2xl font-bold text-slate-800 light:text-[#0D1B35] dark:text-white">My Payslips</h1>
              <p class="text-sm text-slate-500 light:text-[#7A96B2] dark:text-slate-400 mt-0.5">View your salary breakdowns and payslip history</p>
            </div>
          </div>


          <div *ngIf="isLoading" class="flex justify-center p-16">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>

          <div *ngIf="!isLoading && payslips.length === 0" class="text-center py-20 bg-white/5 light:bg-black/5 rounded-xl border border-dashed border-slate-300 light:border-[#1A6DC2]/30 dark:border-blue-900/40">
            <svg class="h-12 w-12 mx-auto text-slate-400 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-slate-500 light:text-[#7A96B2] dark:text-slate-400 font-medium">No payslips available yet.</p>
            <p class="text-slate-400 text-xs mt-1">Your approved payslips will appear here once generated.</p>
          </div>

          <!-- Payslip Cards Grid -->
          <div *ngIf="!isLoading && payslips.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div *ngFor="let slip of payslips"
              class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] rounded-2xl border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 overflow-hidden group hover:border-[#3083DC]/50 transition-all duration-300 shadow-lg">

              <!-- Card Header -->
              <div class="p-5 border-b border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 bg-slate-50/50 light:bg-black/5 dark:bg-white/5 flex justify-between items-start">
                <div>
                  <h3 class="font-bold text-lg text-slate-800 light:text-[#0D1B35] dark:text-white">{{ getMonthName(slip.payPeriod.month) }} {{ slip.payPeriod.year }}</h3>
                  <span class="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    [class]="slip.status === 'locked' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'">
                    {{ slip.status === 'locked' ? 'Approved' : slip.status }}
                  </span>
                </div>
                <div class="text-right">
                  <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Net Pay</p>
                  <p class="font-black text-xl text-emerald-500">₹{{ slip.netPay | number:'1.0-0' }}</p>
                </div>
              </div>

              <!-- Card Body -->
              <div class="p-5 space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-500 light:text-[#7A96B2] dark:text-slate-400">Gross Earnings</span>
                  <span class="font-bold text-slate-700 dark:text-slate-200">₹{{ slip.grossEarnings | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500 light:text-[#7A96B2] dark:text-slate-400">Total Deductions</span>
                  <span class="font-bold text-rose-500">₹{{ slip.totalDeductions | number:'1.0-0' }}</span>
                </div>
                <div class="flex justify-between border-t border-slate-200 dark:border-white/5 pt-3">
                  <span class="text-slate-500 light:text-[#7A96B2] dark:text-slate-400">Paid Days</span>
                  <span class="font-bold text-slate-700 dark:text-slate-200">{{ slip.paidDays }} / {{ slip.daysInMonth }}</span>
                </div>

                <div class="pt-4">
                  <button (click)="openPayslipDetail(slip)"
                    class="w-full py-2.5 bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] hover:bg-[#3083DC]/10 text-[#3083DC] font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-[#3083DC]/30">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Payslip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- =========== PAYSLIP DETAIL MODAL =========== -->
      <div *ngIf="selectedPayslip" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
        <div class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/30 dark:border-blue-900/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
          <div class="flex justify-between items-center p-6 border-b border-slate-200 light:border-[#1A6DC2]/30 dark:border-blue-900/30 bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935]/50 rounded-t-2xl">
            <div>
              <h3 class="font-bold text-xl text-slate-800 light:text-[#0D1B35] dark:text-white">Payslip — {{ getMonthName(selectedPayslip.payPeriod.month) }} {{ selectedPayslip.payPeriod.year }}</h3>
              <p class="text-sm text-slate-500">{{ currentUser?.firstName }} {{ currentUser?.lastName }} • {{ currentUser?.employeeId }}</p>
            </div>
            <button (click)="selectedPayslip = null" class="text-slate-400 hover:text-rose-500 transition-colors text-xl leading-none h-10 w-10 flex items-center justify-center rounded-xl hover:bg-rose-500/10">✕</button>
          </div>

          <div class="p-8 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
            <!-- Summary Info -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] rounded-xl p-4 border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/20">
                <p class="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Working Days</p>
                <p class="text-2xl font-bold text-slate-800 dark:text-white">{{ selectedPayslip.daysInMonth }}</p>
              </div>
              <div class="bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] rounded-xl p-4 border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/20">
                <p class="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Paid Days</p>
                <p class="text-2xl font-bold text-emerald-500">{{ selectedPayslip.paidDays }}</p>
              </div>
              <div class="bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] rounded-xl p-4 border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/20">
                <p class="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">LOP Days</p>
                <p class="text-2xl font-bold font-bold" [class.text-rose-500]="selectedPayslip.lopDays > 0" [class.text-slate-400]="selectedPayslip.lopDays === 0">{{ selectedPayslip.lopDays }}</p>
              </div>
            </div>

            <!-- Earnings & Deductions -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-slate-50/50 light:bg-black/5 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                <div class="bg-[#3083DC]/10 px-6 py-3 border-b border-[#3083DC]/20">
                  <span class="text-xs font-bold uppercase tracking-widest text-[#3083DC]">Earnings</span>
                </div>
                <div class="p-6 space-y-3">
                  <div *ngFor="let c of getEarnings(selectedPayslip)" class="flex justify-between items-center text-sm">
                    <span class="text-slate-600 dark:text-slate-300">
                      {{ c.name }}
                      <span *ngIf="c.isProRated" class="ml-1 text-[8px] font-bold text-[#EE964B] bg-[#EE964B]/10 px-1.5 py-0.5 rounded-full">PRO-RATED</span>
                    </span>
                    <span class="font-bold text-slate-800 dark:text-white">₹{{ c.resolvedAmount | number:'1.0-0' }}</span>
                  </div>
                  <div class="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-between font-black">
                    <span class="text-slate-800 dark:text-white">Gross Total</span>
                    <span class="text-emerald-500">₹{{ selectedPayslip.grossEarnings | number:'1.0-0' }}</span>
                  </div>
                </div>
              </div>

              <div class="bg-slate-50/50 light:bg-black/5 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                <div class="bg-rose-500/10 px-6 py-3 border-b border-rose-500/20">
                  <span class="text-xs font-bold uppercase tracking-widest text-rose-500">Deductions</span>
                </div>
                <div class="p-6 space-y-3">
                  <div *ngFor="let c of getDeductions(selectedPayslip)" class="flex justify-between items-center text-sm">
                    <span class="text-slate-600 dark:text-slate-300">{{ c.name }}</span>
                    <span class="font-bold text-rose-500">₹{{ (c.resolvedAmount || 0) | number:'1.0-0' }}</span>
                  </div>
                  <p *ngIf="getDeductions(selectedPayslip).length === 0" class="text-xs text-slate-500 italic py-2">No deductions applied.</p>
                  <div class="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-between font-black">
                    <span class="text-slate-800 dark:text-white">Total Deductions</span>
                    <span class="text-rose-500">₹{{ selectedPayslip.totalDeductions | number:'1.0-0' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Net Pay Banner -->
            <div class="bg-gradient-to-r from-[#3083DC] to-blue-600 rounded-2xl p-6 flex justify-between items-center shadow-xl">
              <div>
                <span class="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Take Home Pay</span>
                <span class="block text-sm text-white/90">Amount credited to bank</span>
              </div>
              <span class="font-black text-3xl text-white">₹{{ selectedPayslip.netPay | number:'1.0-0' }}</span>
            </div>
          </div>

          <div class="p-6 border-t border-slate-200 light:border-[#1A6DC2]/30 dark:border-blue-900/30 flex justify-end gap-3 bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935]/50 rounded-b-2xl">
            <button (click)="selectedPayslip = null" class="px-6 py-2 bg-[#3083DC] hover:bg-[#2563EB] text-white font-bold rounded-xl transition-all shadow-lg active:scale-95">Close</button>
          </div>
        </div>
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
export class MyPayrollComponent implements OnInit {
  payslips: Payslip[] = [];
  isLoading = true;
  currentUser: any = null;
  selectedPayslip: Payslip | null = null;
  isAdmin: boolean = false;
  userRole: string = '';

  constructor(
    private payrollService: PayrollService,
    private authService: AuthService,
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try { 
          this.currentUser = JSON.parse(userStr); 
          this.userRole = this.currentUser.role?.toLowerCase() || '';
          this.isAdmin = this.userRole === 'admin';
        } catch { }
      }
    }
    if (this.currentUser?._id) {
      this.loadMyPayslips();
    } else {
      this.isLoading = false;
    }
  }

  loadMyPayslips() {
    this.isLoading = true;
    this.payrollService.getEmployeePayslips(this.currentUser._id).subscribe({
      next: (data) => {
        this.payslips = data.filter((p: Payslip) => p.status === 'approved' || p.status === 'locked');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load payslips', err);
        this.isLoading = false;
      }
    });
  }

  getMonthName(monthNum: number): string {
    return MONTHS[monthNum - 1] || '';
  }

  openPayslipDetail(slip: Payslip) {
    this.selectedPayslip = slip;
  }

  getEarnings(slip: Payslip) {
    return slip.components?.filter((c: any) => c.type === 'earning') || [];
  }

  getDeductions(slip: Payslip) {
    return slip.components?.filter((c: any) => c.type === 'deduction') || [];
  }
}
