import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PayrollService, Payslip, PayrollSettings } from '../../services/payroll.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

@Component({
  selector: 'app-payroll-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-[#101935] text-white font-sans overflow-hidden">
      <app-admin-sidebar class="flex-shrink-0"></app-admin-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header title="Payroll Dashboard"></app-shared-header>

        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 bg-[#101935]">

          <!-- Tabs -->
          <div class="flex space-x-1 border-b border-blue-900/30">
            <button *ngFor="let tab of tabs" (click)="activeTab = tab.key"
                class="px-5 py-2.5 font-medium text-sm bg-transparent border-b-2 transition-colors"
                [class.border-blue-500]="activeTab === tab.key"
                [class.text-blue-400]="activeTab === tab.key"
                [class.border-transparent]="activeTab !== tab.key"
                [class.text-slate-400]="activeTab !== tab.key">
              {{ tab.label }}
            </button>
          </div>

          <!-- =========== ANALYTICS TAB =========== -->
          <div *ngIf="activeTab === 'analytics'" class="space-y-6">
            <div *ngIf="isAnalyticsLoading" class="text-center py-10 text-slate-400">Loading metrics...</div>
            
            <ng-container *ngIf="!isAnalyticsLoading">
              <!-- KPI Cards -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-gradient-to-br from-[#1B264F] to-[#151f42] rounded-2xl border border-blue-900/40 p-6 relative overflow-hidden shadow-xl shadow-blue-900/10">
                  <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                  <h3 class="text-sm font-semibold text-slate-400 mb-1">Current Month Outgoing</h3>
                  <div class="text-3xl font-black text-white tracking-tight">₹{{ (currentMonthStats?.totalNetPay || 0) | number:'1.0-0' }}</div>
                  <p class="text-xs text-slate-500 mt-2">Total Net Pay Across {{ currentMonthStats?.headcount || 0 }} Employees</p>
                </div>

                <div class="bg-gradient-to-br from-[#1B264F] to-[#151f42] rounded-2xl border border-green-900/30 p-6 relative overflow-hidden shadow-xl shadow-green-900/5">
                  <div class="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>
                  <h3 class="text-sm font-semibold text-slate-400 mb-1">Average Net Salary</h3>
                  <div class="text-3xl font-black text-green-400 tracking-tight">₹{{ (currentMonthStats?.averageNet || 0) | number:'1.0-0' }}</div>
                  <p class="text-xs text-slate-500 mt-2">Avg Gross: ₹{{ (currentMonthStats?.averageGross || 0) | number:'1.0-0' }}</p>
                </div>

                <div class="bg-gradient-to-br from-[#1B264F] to-[#151f42] rounded-2xl border border-red-900/30 p-6 relative overflow-hidden shadow-xl shadow-red-900/5">
                  <div class="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>
                  <h3 class="text-sm font-semibold text-slate-400 mb-1">Total Deductions</h3>
                  <div class="text-3xl font-black text-red-400 tracking-tight">₹{{ (currentMonthStats?.totalDeductions || 0) | number:'1.0-0' }}</div>
                  <p class="text-xs text-slate-500 mt-2">Taxes, PF, ESI, etc.</p>
                </div>

                <div class="bg-gradient-to-br from-[#1B264F] to-[#151f42] rounded-2xl border border-orange-900/30 p-6 relative overflow-hidden shadow-xl shadow-orange-900/5">
                  <div class="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
                  <h3 class="text-sm font-semibold text-slate-400 mb-1">LOP Penalties</h3>
                  <div class="text-3xl font-black text-orange-400 tracking-tight">{{ currentMonthStats?.totalLopDays || 0 }} Days</div>
                  <p class="text-xs text-slate-500 mt-2">Total lost days due to absence/late</p>
                </div>
              </div>

              <!-- Content Area -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Trend Chart -->
                <div class="lg:col-span-2 bg-[#1B264F] rounded-2xl border border-blue-900/30 p-6 shadow-xl">
                  <h2 class="text-lg font-bold text-slate-200 mb-6">6-Month Expenditure Trend</h2>
                  
                  <div class="flex items-end space-x-2 h-64 mt-4">
                    <div *ngFor="let t of trendData" class="flex-1 flex flex-col items-center group relative">
                      
                      <!-- Hover Tooltip -->
                      <div class="opacity-0 group-hover:opacity-100 absolute -top-16 bg-[#0D1B35] border border-blue-900/50 rounded-lg p-2 text-xs w-32 shadow-2xl z-10 transition-opacity pointer-events-none">
                        <div class="font-bold text-white mb-1">{{ months[t._id.month - 1] }} {{ t._id.year }}</div>
                        <div class="flex justify-between"><span class="text-slate-400">Net:</span><span class="text-green-400">₹{{ t.totalNet | number:'1.0-0' }}</span></div>
                        <div class="flex justify-between"><span class="text-slate-400">Deducted:</span><span class="text-red-400">₹{{ t.totalDeductions | number:'1.0-0' }}</span></div>
                      </div>

                      <div class="w-full flex justify-center items-end h-full relative space-x-1 px-1">
                        <!-- Gross Background bar -->
                        <div class="w-full max-w-[40px] bg-blue-900/20 rounded-t-lg absolute bottom-0" 
                            [style.height.%]="(t.totalGross / getMaxTrendNetPay()) * 100">
                        </div>
                        <!-- Net Pay overlay bar -->
                        <div class="w-full max-w-[40px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg relative z-0 transition-transform group-hover:scale-y-[1.02] origin-bottom shadow-lg"
                             [style.height.%]="(t.totalNet / getMaxTrendNetPay()) * 100">
                        </div>
                      </div>
                      
                      <span class="text-[10px] sm:text-xs font-semibold text-slate-400 mt-3">{{ months[t._id.month - 1].substring(0,3) }}</span>
                    </div>
                    
                    <div *ngIf="trendData.length === 0" class="w-full text-center text-slate-500 py-20 text-sm">No historical data available</div>
                  </div>
                </div>

                <!-- Current Distribution -->
                <div class="bg-[#1B264F] rounded-2xl border border-blue-900/30 p-6 shadow-xl flex flex-col">
                  <h2 class="text-lg font-bold text-slate-200 mb-6">Current Month Spread</h2>
                  
                  <div *ngIf="currentMonthStats" class="flex-1 flex flex-col justify-center space-y-6">
                    <div>
                      <div class="flex justify-between text-sm mb-2">
                        <span class="text-slate-300 font-medium">Net Take-Home</span>
                        <span class="text-green-400 font-bold">{{ ((currentMonthStats.totalNetPay / currentMonthStats.totalGross) * 100) || 0 | number:'1.0-1' }}%</span>
                      </div>
                      <div class="w-full bg-[#0D1B35] rounded-full h-3">
                        <div class="bg-green-500 h-3 rounded-full" [style.width.%]="(currentMonthStats.totalNetPay / currentMonthStats.totalGross) * 100"></div>
                      </div>
                    </div>

                    <div>
                      <div class="flex justify-between text-sm mb-2">
                        <span class="text-slate-300 font-medium">Taxes / Deductions</span>
                        <span class="text-red-400 font-bold">{{ ((currentMonthStats.totalDeductions / currentMonthStats.totalGross) * 100) || 0 | number:'1.0-1' }}%</span>
                      </div>
                      <div class="w-full bg-[#0D1B35] rounded-full h-3">
                        <div class="bg-red-500 h-3 rounded-full" [style.width.%]="(currentMonthStats.totalDeductions / currentMonthStats.totalGross) * 100"></div>
                      </div>
                    </div>
                    
                    <div class="mt-auto pt-6 border-t border-blue-900/30 text-center">
                      <p class="text-sm text-slate-400">Total Gross Billed</p>
                      <p class="text-xl font-bold text-white">₹{{ (currentMonthStats.totalGross || 0) | number:'1.0-0' }}</p>
                    </div>
                  </div>
                  
                  <div *ngIf="!currentMonthStats" class="flex-1 flex items-center justify-center text-slate-500 text-sm">
                    No run exists for the latest period.
                  </div>
                </div>
              </div>
            </ng-container>
          </div>

          <!-- =========== RUN PAYROLL TAB =========== -->
          <div *ngIf="activeTab === 'run'" class="space-y-6">
            <!-- Period Selector & Stats Cards -->
            <div class="bg-[#1B264F] rounded-xl border border-blue-900/30 p-6">
              <h2 class="text-lg font-bold mb-4 text-slate-200">Select Pay Period</h2>
              <div class="flex flex-wrap gap-4 items-end">
                <div>
                  <label class="block text-xs font-semibold text-slate-400 mb-1">Year</label>
                  <select [(ngModel)]="selectedYear" class="bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <option *ngFor="let y of years" [value]="y">{{ y }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-400 mb-1">Month</label>
                  <select [(ngModel)]="selectedMonth" class="bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <option *ngFor="let m of months; let i = index" [value]="i + 1">{{ m }}</option>
                  </select>
                </div>
                <button (click)="loadPayslipsForPeriod()" [disabled]="isLoading"
                    class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-200 transition-colors disabled:opacity-50">
                  {{ isLoading ? 'Loading...' : 'Load Period' }}
                </button>
                <button (click)="runPayroll()" [disabled]="isRunning"
                    class="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/30 ml-auto">
                  <span *ngIf="!isRunning">⚡ Run Payroll for {{ months[selectedMonth - 1] }} {{ selectedYear }}</span>
                  <span *ngIf="isRunning">Running...</span>
                </button>
              </div>

              <!-- Run Result Banner -->
              <div *ngIf="runResult" class="mt-4 p-4 rounded-xl border"
                  [class.bg-green-900_20]="runResult.summary.errors === 0"
                  [class.border-green-500_30]="runResult.summary.errors === 0"
                  [class.bg-orange-900_20]="runResult.summary.errors > 0"
                  [class.border-orange-500_30]="runResult.summary.errors > 0">
                <p class="font-semibold text-sm">{{ runResult.message }}</p>
                <div class="flex gap-6 mt-2 text-xs text-slate-400">
                  <span>Total: <strong class="text-white">{{ runResult.summary.total }}</strong></span>
                  <span>Generated: <strong class="text-green-400">{{ runResult.summary.success }}</strong></span>
                  <span>Skipped: <strong class="text-yellow-400">{{ runResult.summary.skipped }}</strong></span>
                  <span>Errors: <strong class="text-red-400">{{ runResult.summary.errors }}</strong></span>
                </div>
              </div>
            </div>

            <!-- Payslip Table -->
            <div *ngIf="payslips.length > 0" class="bg-[#1B264F] rounded-xl border border-blue-900/30 overflow-hidden">
              <div class="flex justify-between items-center p-5 border-b border-blue-900/30">
                <h3 class="font-bold text-slate-200">
                  Payslips — {{ months[selectedMonth - 1] }} {{ selectedYear }}
                  <span class="ml-2 text-sm text-slate-400">({{ payslips.length }} employees)</span>
                </h3>
                <div class="flex items-center gap-3 text-sm font-semibold">
                  <span class="text-slate-400">Total Net Pay:</span>
                  <span class="text-green-400 text-lg">₹{{ getTotalNetPay() | number:'1.0-0' }}</span>
                </div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-[#0D1B35]">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Template</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid Days</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">LOP Days</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Deductions</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Pay</th>
                      <th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-blue-900/20">
                    <tr *ngFor="let slip of payslips" class="hover:bg-white/2 transition-colors">
                      <td class="px-4 py-3">
                        <div class="font-medium text-white">{{ slip.employeeId?.firstName }} {{ slip.employeeId?.lastName }}</div>
                        <div class="text-xs text-slate-400">{{ slip.employeeId?.email }}</div>
                      </td>
                      <td class="px-4 py-3 text-slate-300">{{ slip.salaryTemplate?.name || '—' }}</td>
                      <td class="px-4 py-3 text-right text-slate-300">{{ slip.paidDays }}</td>
                      <td class="px-4 py-3 text-right" [class.text-red-400]="slip.lopDays > 0" [class.text-slate-400]="slip.lopDays === 0">{{ slip.lopDays }}</td>
                      <td class="px-4 py-3 text-right text-slate-300">₹{{ slip.grossEarnings | number:'1.0-2' }}</td>
                      <td class="px-4 py-3 text-right text-red-400">₹{{ slip.totalDeductions | number:'1.0-2' }}</td>
                      <td class="px-4 py-3 text-right font-bold text-green-400">₹{{ slip.netPay | number:'1.0-2' }}</td>
                      <td class="px-4 py-3 text-center">
                        <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            [class.bg-yellow-500_10]="slip.status === 'draft'"
                            [class.text-yellow-400]="slip.status === 'draft'"
                            [class.bg-green-500_10]="slip.status === 'locked'"
                            [class.text-green-400]="slip.status === 'locked'">
                          {{ slip.status }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <div class="flex justify-center gap-2">
                          <button (click)="openPayslipDetail(slip)" class="text-blue-400 hover:text-blue-300 text-xs font-medium">View</button>
                          <button *ngIf="slip.status !== 'locked'" (click)="approvePayslip(slip)"
                              class="text-green-400 hover:text-green-300 text-xs font-medium">Approve</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div *ngIf="payslips.length === 0 && !isLoading" class="text-center py-16 bg-[#1B264F]/50 rounded-xl border border-dashed border-blue-900/40">
              <p class="text-slate-500 text-sm">No payslips found for this period. Click "Run Payroll" to generate them.</p>
            </div>
          </div>

          <!-- =========== PAYSLIP DETAIL MODAL =========== -->
          <div *ngIf="selectedPayslip" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div class="bg-[#1B264F] border border-blue-900/50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div class="flex justify-between items-center p-5 border-b border-blue-900/30 bg-[#151f42] rounded-t-xl">
                <div>
                  <h3 class="font-bold text-lg">Payslip — {{ months[selectedPayslip.payPeriod.month - 1] }} {{ selectedPayslip.payPeriod.year }}</h3>
                  <p class="text-sm text-slate-400">{{ selectedPayslip.employeeId?.firstName }} {{ selectedPayslip.employeeId?.lastName }}</p>
                </div>
                <button (click)="selectedPayslip = null" class="text-slate-400 hover:text-white transition-colors text-xl leading-none">✕</button>
              </div>
              <div class="p-5 overflow-y-auto flex-1 space-y-5">
                <!-- Summary -->
                <div class="grid grid-cols-3 gap-3">
                  <div class="bg-[#0D1B35] rounded-lg p-3 text-center">
                    <p class="text-xs text-slate-500 mb-1">Working Days</p>
                    <p class="text-xl font-bold">{{ selectedPayslip.daysInMonth }}</p>
                  </div>
                  <div class="bg-[#0D1B35] rounded-lg p-3 text-center">
                    <p class="text-xs text-slate-500 mb-1">Paid Days</p>
                    <p class="text-xl font-bold text-green-400">{{ selectedPayslip.paidDays }}</p>
                  </div>
                  <div class="bg-[#0D1B35] rounded-lg p-3 text-center">
                    <p class="text-xs text-slate-500 mb-1">LOP Days</p>
                    <p class="text-xl font-bold" [class.text-red-400]="selectedPayslip.lopDays > 0" [class.text-slate-400]="selectedPayslip.lopDays === 0">{{ selectedPayslip.lopDays }}</p>
                  </div>
                </div>

                <!-- Components Table -->
                <div>
                  <div class="grid grid-cols-2 gap-4">
                    <!-- Earnings -->
                    <div>
                      <h4 class="text-xs font-bold uppercase tracking-wider text-green-500 mb-2">Earnings</h4>
                      <div class="space-y-2">
                        <div *ngFor="let c of getEarnings(selectedPayslip)" class="flex justify-between items-center">
                          <span class="text-sm text-slate-300">
                            {{ c.name }}
                            <span *ngIf="c.isProRated" class="text-[9px] text-orange-400 ml-1">PRO-RATED</span>
                          </span>
                          <span class="text-sm font-medium text-white">₹{{ c.resolvedAmount | number:'1.0-2' }}</span>
                        </div>
                      </div>
                      <div class="mt-3 pt-3 border-t border-blue-900/30 flex justify-between font-bold">
                        <span class="text-slate-300">Gross Earnings</span>
                        <span class="text-green-400">₹{{ selectedPayslip.grossEarnings | number:'1.0-2' }}</span>
                      </div>
                    </div>
                    <!-- Deductions -->
                    <div>
                      <h4 class="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">Deductions</h4>
                      <div class="space-y-2">
                        <div *ngFor="let c of getDeductions(selectedPayslip)" class="flex justify-between items-center">
                          <span class="text-sm text-slate-300">{{ c.name }}</span>
                          <span class="text-sm font-medium text-red-400">₹{{ c.resolvedAmount | number:'1.0-2' }}</span>
                        </div>
                        <p *ngIf="getDeductions(selectedPayslip).length === 0" class="text-xs text-slate-500">No deductions</p>
                      </div>
                      <div class="mt-3 pt-3 border-t border-blue-900/30 flex justify-between font-bold">
                        <span class="text-slate-300">Total Deductions</span>
                        <span class="text-red-400">₹{{ selectedPayslip.totalDeductions | number:'1.0-2' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Net Pay -->
                <div class="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700/30 rounded-xl p-4 flex justify-between items-center">
                  <span class="font-bold text-lg text-slate-200">Net Pay</span>
                  <span class="font-black text-2xl text-green-400">₹{{ selectedPayslip.netPay | number:'1.0-2' }}</span>
                </div>
              </div>
              <div class="p-4 border-t border-blue-900/30 flex justify-end gap-3">
                <button (click)="selectedPayslip = null" class="px-4 py-2 text-sm text-slate-300 hover:text-white bg-transparent hover:bg-white/5 rounded-lg transition-colors">Close</button>
                <button *ngIf="selectedPayslip.status !== 'locked'" (click)="approvePayslip(selectedPayslip); selectedPayslip = null"
                    class="px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                  ✓ Approve & Lock
                </button>
              </div>
            </div>
          </div>

          <!-- =========== SETTINGS TAB =========== -->
          <div *ngIf="activeTab === 'settings'" class="space-y-6">
            <h2 class="text-xl font-bold">Payroll Cycle & Rules</h2>
            <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="space-y-6">

              <!-- Cycle Settings -->
              <div class="bg-[#1B264F] rounded-xl border border-blue-900/30 p-6">
                <h3 class="font-semibold text-slate-200 mb-4">Pay Cycle</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-5" formGroupName="payrollSettings">
                  <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Frequency</label>
                    <select formControlName="frequency" class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                      <option value="monthly">Monthly</option>
                      <option value="bi-weekly">Bi-Weekly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Pay Period Start Day</label>
                    <input type="number" formControlName="payPeriodStartDay" min="1" max="28" class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <p class="text-[10px] text-slate-500 mt-1">Day of month when pay period starts (1-28)</p>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Salary Disbursal Day</label>
                    <input type="number" formControlName="salaryDisbursalDay" min="1" max="31" class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <p class="text-[10px] text-slate-500 mt-1">Day salaries are credited each month</p>
                  </div>
                </div>
              </div>

              <!-- LOP Rules -->
              <div class="bg-[#1B264F] rounded-xl border border-blue-900/30 p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold text-slate-200">Loss of Pay (LOP) Rules</h3>
                  <div formGroupName="payrollSettings">
                    <div formGroupName="lopRules">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" formControlName="enabled" class="rounded bg-[#0D1B35] border-blue-900/30 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
                        <span class="text-sm font-medium text-slate-300">Enable LOP Rules</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5" formGroupName="payrollSettings">
                  <div formGroupName="lopRules" class="space-y-4">
                    <label class="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" formControlName="absentWithoutApprovalIsLOP" class="mt-0.5 rounded bg-[#0D1B35] border-blue-900/30 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
                      <div>
                        <span class="text-sm font-medium text-slate-300 block">Unapproved Absence = LOP Day</span>
                        <span class="text-xs text-slate-500">Any absent day not marked as approved leave will deduct one LOP day.</span>
                      </div>
                    </label>
                    <label class="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" formControlName="considerLateMarksAsLOP" class="mt-0.5 rounded bg-[#0D1B35] border-blue-900/30 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
                      <div>
                        <span class="text-sm font-medium text-slate-300 block">Late Marks Above Threshold = LOP</span>
                        <span class="text-xs text-slate-500">Every N late marks results in one LOP day.</span>
                      </div>
                    </label>
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Late Marks Threshold (N)</label>
                      <input type="number" formControlName="lateMarksThreshold" min="1" class="w-32 bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                    </div>
                  </div>
                </div>
              </div>

              <!-- OT Rules -->
              <div class="bg-[#1B264F] rounded-xl border border-blue-900/30 p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold text-slate-200">Overtime (OT) Rules</h3>
                  <div formGroupName="payrollSettings">
                    <div formGroupName="overtimeRules">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" formControlName="enabled" class="rounded bg-[#0D1B35] border-blue-900/30 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
                        <span class="text-sm font-medium text-slate-300">Enable OT Calculation</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5" formGroupName="payrollSettings">
                  <div formGroupName="overtimeRules" class="space-y-4">
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Standard Work Hours / Day</label>
                      <input type="number" formControlName="standardWorkHoursPerDay" min="1" max="24" class="w-32 bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">OT Multiplier (e.g. 1.5 = 150%)</label>
                      <input type="number" formControlName="overtimeMultiplier" min="1" step="0.5" class="w-32 bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex justify-end">
                <button type="submit" [disabled]="isSavingSettings" class="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-lg shadow-blue-900/30">
                  {{ isSavingSettings ? 'Saving...' : 'Save Payroll Settings' }}
                </button>
              </div>
            </form>
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    .bg-green-900_20 { background-color: rgba(20, 83, 45, 0.2); }
    .border-green-500_30 { border-color: rgba(34, 197, 94, 0.3); }
    .bg-orange-900_20 { background-color: rgba(124, 45, 18, 0.2); }
    .border-orange-500_30 { border-color: rgba(249, 115, 22, 0.3); }
    .bg-yellow-500_10 { background-color: rgba(234, 179, 8, 0.1); }
    .bg-green-500_10 { background-color: rgba(34, 197, 94, 0.1); }
  `]
})
export class PayrollDashboardComponent implements OnInit {
  activeTab = 'analytics';
  tabs = [
    { key: 'analytics', label: 'Analytics' },
    { key: 'run', label: 'Payroll Run' },
    { key: 'settings', label: 'Cycle & Rules' }
  ];

  months = MONTHS;
  years: number[] = [];
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;

  payslips: Payslip[] = [];
  selectedPayslip: Payslip | null = null;
  runResult: any = null;
  
  // Analytics Data
  trendData: any[] = [];
  currentMonthStats: any = null;
  isAnalyticsLoading = false;

  settingsForm!: FormGroup;

  isLoading = false;
  isRunning = false;
  isSavingSettings = false;

  constructor(private payrollService: PayrollService, private fb: FormBuilder) {
    const cur = new Date().getFullYear();
    for (let y = cur - 2; y <= cur + 1; y++) this.years.push(y);
  }

  ngOnInit() {
    this.initSettingsForm();
    this.loadSettings();
    this.loadPayslipsForPeriod();
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.isAnalyticsLoading = true;
    this.payrollService.getPayrollAnalytics().subscribe({
      next: (res) => {
        this.trendData = res.trendData || [];
        this.currentMonthStats = res.currentMonthStats;
        this.isAnalyticsLoading = false;
      },
      error: (err) => {
        console.error('Failed to load analytics', err);
        this.isAnalyticsLoading = false;
      }
    });
  }

  // --- Utility for CSS Trend Bars ---
  getMaxTrendNetPay(): number {
      if(!this.trendData || this.trendData.length === 0) return 1;
      return Math.max(...this.trendData.map(d => d.totalNet));
  }

  initSettingsForm() {
    this.settingsForm = this.fb.group({
      payrollSettings: this.fb.group({
        frequency: ['monthly'],
        payPeriodStartDay: [1],
        salaryDisbursalDay: [30],
        lopRules: this.fb.group({
          enabled: [false],
          considerLateMarksAsLOP: [false],
          lateMarksThreshold: [3],
          absentWithoutApprovalIsLOP: [true]
        }),
        overtimeRules: this.fb.group({
          enabled: [false],
          standardWorkHoursPerDay: [8],
          overtimeMultiplier: [1.5]
        })
      })
    });
  }

  loadSettings() {
    this.payrollService.getPayrollSettings().subscribe({
      next: (res) => {
        if (res?.payrollSettings) {
          const s = res.payrollSettings;
          (this.settingsForm.get('payrollSettings') as FormGroup).patchValue({
            frequency: s.frequency || 'monthly',
            payPeriodStartDay: s.payPeriodStartDay || 1,
            salaryDisbursalDay: s.salaryDisbursalDay || 30,
            lopRules: {
              enabled: s.lopRules?.enabled ?? false,
              considerLateMarksAsLOP: s.lopRules?.considerLateMarksAsLOP ?? false,
              lateMarksThreshold: s.lopRules?.lateMarksThreshold ?? 3,
              absentWithoutApprovalIsLOP: s.lopRules?.absentWithoutApprovalIsLOP ?? true
            },
            overtimeRules: {
              enabled: s.overtimeRules?.enabled ?? false,
              standardWorkHoursPerDay: s.overtimeRules?.standardWorkHoursPerDay ?? 8,
              overtimeMultiplier: s.overtimeRules?.overtimeMultiplier ?? 1.5
            }
          });
        }
      },
      error: (err) => console.error('Failed to load payroll settings', err)
    });
  }

  loadPayslipsForPeriod() {
    this.isLoading = true;
    this.payrollService.getPayslips(this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => { this.payslips = res; this.isLoading = false; },
      error: (err) => { console.error('Failed to load payslips', err); this.isLoading = false; }
    });
  }

  runPayroll() {
    if (!confirm(`Generate draft payslips for ${this.months[this.selectedMonth - 1]} ${this.selectedYear}? Existing approved payslips will be skipped.`)) return;
    this.isRunning = true;
    this.runResult = null;
    this.payrollService.runPayroll(this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => {
        this.runResult = res;
        this.isRunning = false;
        this.loadPayslipsForPeriod();
      },
      error: (err) => {
        console.error('Failed to run payroll', err);
        this.isRunning = false;
        alert('Payroll run failed. Check the console for errors.');
      }
    });
  }

  approvePayslip(slip: Payslip) {
    if (!slip._id) return;
    if (!confirm(`Approve and lock payslip for ${slip.employeeId?.firstName}? This cannot be undone.`)) return;
    this.payrollService.approvePayslip(slip._id).subscribe({
      next: () => this.loadPayslipsForPeriod(),
      error: (err) => { console.error('Approval failed', err); alert('Approval failed. Check console.'); }
    });
  }

  openPayslipDetail(slip: Payslip) {
    this.selectedPayslip = slip;
  }

  getEarnings(slip: Payslip) {
    return slip.components?.filter(c => c.type === 'earning') || [];
  }

  getDeductions(slip: Payslip) {
    return slip.components?.filter(c => c.type === 'deduction') || [];
  }

  getTotalNetPay(): number {
    return this.payslips.reduce((sum, s) => sum + (s.netPay || 0), 0);
  }

  saveSettings() {
    this.isSavingSettings = true;
    this.payrollService.updatePayrollSettings(this.settingsForm.value).subscribe({
      next: () => { this.isSavingSettings = false; alert('Payroll settings saved successfully.'); },
      error: (err) => { console.error('Failed to save settings', err); this.isSavingSettings = false; }
    });
  }
}
