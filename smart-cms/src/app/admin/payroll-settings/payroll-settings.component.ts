import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PayrollService, SalaryComponent, SalaryTemplate } from '../../services/payroll.service';
import { AuthService } from '../../services/auth.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';

@Component({
  selector: 'app-payroll-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-[#101935] text-white font-sans overflow-hidden">
      <app-admin-sidebar class="flex-shrink-0"></app-admin-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header title="Payroll Settings"></app-shared-header>
        
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar bg-[#101935]">
          <!-- Tabs -->
          <div class="flex space-x-4 border-b border-blue-900/30 mb-6">
            <button class="px-4 py-2 font-medium bg-transparent border-b-2 transition-colors"
                [class.border-blue-500]="activeTab === 'components'"
                [class.text-blue-400]="activeTab === 'components'"
                [class.border-transparent]="activeTab !== 'components'"
                [class.text-slate-400]="activeTab !== 'components'"
                (click)="activeTab = 'components'">
              Salary Components
            </button>
            <button class="px-4 py-2 font-medium bg-transparent border-b-2 transition-colors"
                [class.border-blue-500]="activeTab === 'templates'"
                [class.text-blue-400]="activeTab === 'templates'"
                [class.border-transparent]="activeTab !== 'templates'"
                [class.text-slate-400]="activeTab !== 'templates'"
                (click)="activeTab = 'templates'">
              Salary Templates
            </button>
            <button class="px-4 py-2 font-medium bg-transparent border-b-2 transition-colors"
                [class.border-blue-500]="activeTab === 'assignments'"
                [class.text-blue-400]="activeTab === 'assignments'"
                [class.border-transparent]="activeTab !== 'assignments'"
                [class.text-slate-400]="activeTab !== 'assignments'"
                (click)="activeTab = 'assignments'">
              User Assignments
            </button>
          </div>

          <!-- Components Tab -->
          <div *ngIf="activeTab === 'components'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-bold">Salary Components</h2>
              <button (click)="openComponentModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                + New Component
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div *ngFor="let comp of components" class="bg-[#1B264F] rounded-xl border border-blue-900/30 p-5 hover:border-blue-700/50 transition-all">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-bold text-lg text-slate-100">{{ comp.name }}</h3>
                  <span class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
                      [class.bg-green-500_10]="comp.type === 'earning'"
                      [class.text-green-400]="comp.type === 'earning'"
                      [class.bg-red-500_10]="comp.type === 'deduction'"
                      [class.text-red-400]="comp.type === 'deduction'">
                    {{ comp.type }}
                  </span>
                </div>
                <p class="text-xs text-slate-400 mb-4 h-8">{{ comp.description || 'No description provided' }}</p>
                <div class="space-y-2 text-sm text-slate-300">
                  <div class="flex justify-between">
                    <span class="text-slate-500">Calculation:</span>
                    <span class="font-medium capitalize">{{ comp.calculationType }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">Default Value:</span>
                    <span class="font-medium">
                      {{ comp.calculationType === 'flat' ? '₹' + comp.amountOrPercentage : comp.amountOrPercentage + '%' }}
                      <span *ngIf="comp.calculationType === 'percentage' && comp.percentageOf" class="text-xs text-slate-500 ml-1">of {{ comp.percentageOf.name || 'Gross' }}</span>
                      <span *ngIf="comp.calculationType === 'percentage' && !comp.percentageOf" class="text-xs text-slate-500 ml-1">of Gross</span>
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">Taxable:</span>
                    <span [class.text-green-400]="comp.isTaxable" [class.text-red-400]="!comp.isTaxable">{{ comp.isTaxable ? 'Yes' : 'No' }}</span>
                  </div>
                </div>
                <div class="mt-4 pt-4 border-t border-blue-900/30 flex justify-end">
                  <button (click)="editComponent(comp)" class="text-blue-400 hover:text-blue-300 text-sm font-medium">Edit</button>
                </div>
              </div>
            </div>
            
            <div *ngIf="components.length === 0" class="text-center py-12 bg-[#1B264F]/50 rounded-xl border border-dashed border-blue-900/40">
              <p class="text-slate-400">No salary components defined yet.</p>
            </div>
          </div>

          <!-- Component Modal -->
          <div *ngIf="showComponentModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div class="bg-[#1B264F] border border-blue-900/50 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div class="flex justify-between items-center p-5 border-b border-blue-900/30 bg-[#151f42]">
                <h3 class="font-bold text-lg">{{ editingComponentId ? 'Edit' : 'New' }} Component</h3>
                <button (click)="closeComponentModal()" class="text-slate-400 hover:text-white transition-colors">✕</button>
              </div>
              <div class="p-5">
                <form [formGroup]="componentForm" (ngSubmit)="saveComponent()">
                  <div class="space-y-4">
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Component Name *</label>
                      <input formControlName="name" type="text" class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none placeholder-slate-600" placeholder="e.g. Basic Pay">
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                      <textarea formControlName="description" rows="2" class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none placeholder-slate-600" placeholder="Optional brief description"></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-semibold text-slate-400 mb-1">Type *</label>
                        <select formControlName="type" class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                          <option value="earning">Earning</option>
                          <option value="deduction">Deduction</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-slate-400 mb-1">Calculation *</label>
                        <select formControlName="calculationType" class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                          <option value="flat">Flat Amount</option>
                          <option value="percentage">Percentage</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">
                        {{ componentForm.get('calculationType')?.value === 'flat' ? 'Default Amount (₹)' : 'Percentage Value (%)' }} *
                      </label>
                      <input formControlName="amountOrPercentage" type="number" class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                    </div>

                    <div *ngIf="componentForm.get('calculationType')?.value === 'percentage'">
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Percentage Of (Optional)</label>
                      <select formControlName="percentageOf" class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                        <option [ngValue]="null">Gross Pay (All Earnings)</option>
                        <ng-container *ngFor="let c of components">
                          <option *ngIf="c._id !== editingComponentId" [value]="c._id">{{ c.name }}</option>
                        </ng-container>
                      </select>
                      <p class="text-[10px] text-slate-500 mt-1">If blank, it calculates as a percentage of total Gross Earnings.</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4 pt-2">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input formControlName="isTaxable" type="checkbox" class="rounded bg-[#0D1B35] border-blue-900/30 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
                        <span class="text-sm font-medium text-slate-300">Is Taxable</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input formControlName="dependsOnAttendance" type="checkbox" class="rounded bg-[#0D1B35] border-blue-900/30 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
                        <span class="text-sm font-medium text-slate-300">Pro-rata (LOP applies)</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input formControlName="isPartOfGross" type="checkbox" class="rounded bg-[#0D1B35] border-blue-900/30 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
                        <span class="text-sm font-medium text-slate-300">Part of Gross Pay</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input formControlName="isStatutory" type="checkbox" class="rounded bg-[#0D1B35] border-blue-900/30 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
                        <span class="text-sm font-medium text-slate-300">Is Statutory (PF/ESI)</span>
                      </label>
                    </div>
                  </div>
                  
                  <div class="mt-6 flex gap-3 justify-end">
                    <button type="button" (click)="closeComponentModal()" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-transparent hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" [disabled]="componentForm.invalid || isSubmitting" class="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors">
                      {{ isSubmitting ? 'Saving...' : 'Save Component' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- Templates Tab -->
          <div *ngIf="activeTab === 'templates'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-bold">Salary Templates</h2>
              <button (click)="openTemplateModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                + New Template
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let tpl of templates" class="bg-[#1B264F] rounded-xl border border-blue-900/30 p-5 hover:border-blue-700/50 transition-all">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-bold text-lg text-slate-100">{{ tpl.name }}</h3>
                  <span *ngIf="tpl.isDefaultTemplate" class="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-[10px] font-bold uppercase tracking-wider">
                    Default
                  </span>
                </div>
                <p class="text-xs text-slate-400 mb-4">{{ tpl.description || 'No description provided' }}</p>
                
                <div class="space-y-2 mt-4 pt-4 border-t border-blue-900/30">
                  <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Included Components</p>
                  <div class="flex flex-wrap gap-2">
                    <span *ngFor="let compRef of tpl.components" class="px-2 py-1 bg-[#0D1B35] border border-blue-900/50 rounded text-xs text-slate-300">
                      {{ getComponentName(compRef.component) }}
                      <span *ngIf="compRef.overrideAmount" class="ml-1 text-blue-400">(Override: ₹{{ compRef.overrideAmount }})</span>
                    </span>
                  </div>
                </div>

                <div class="mt-4 pt-4 border-t border-blue-900/30 flex justify-end">
                  <button (click)="editTemplate(tpl)" class="text-blue-400 hover:text-blue-300 text-sm font-medium">Edit</button>
                </div>
              </div>
            </div>

            <div *ngIf="templates.length === 0" class="text-center py-12 bg-[#1B264F]/50 rounded-xl border border-dashed border-blue-900/40">
              <p class="text-slate-400">No salary templates defined yet. Create some components first.</p>
            </div>
          </div>

          <!-- Template Modal -->
          <div *ngIf="showTemplateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div class="bg-[#1B264F] border border-blue-900/50 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div class="flex justify-between items-center p-5 border-b border-blue-900/30 bg-[#151f42]">
                <h3 class="font-bold text-lg">{{ editingTemplateId ? 'Edit' : 'New' }} Salary Template</h3>
                <button (click)="closeTemplateModal()" class="text-slate-400 hover:text-white transition-colors">✕</button>
              </div>
              <div class="p-5 overflow-y-auto custom-scrollbar flex-1">
                <form [formGroup]="templateForm" (ngSubmit)="saveTemplate()">
                  <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-semibold text-slate-400 mb-1">Template Name *</label>
                        <input formControlName="name" type="text" class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none placeholder-slate-600" placeholder="e.g. L1 Engineer Band">
                      </div>
                      <div class="flex items-center pt-6">
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input formControlName="isDefaultTemplate" type="checkbox" class="rounded bg-[#0D1B35] border-blue-900/30 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
                          <span class="text-sm font-medium text-slate-300">Set as Default Template</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                      <textarea formControlName="description" rows="2" class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none placeholder-slate-600" placeholder="Optional brief description"></textarea>
                    </div>

                    <div class="mt-6">
                      <div class="flex justify-between items-center mb-4">
                        <label class="block text-sm font-bold text-slate-300">Included Components</label>
                      </div>
                      <div class="space-y-3 bg-[#0D1B35] p-4 rounded-xl border border-blue-900/20 max-h-64 overflow-y-auto custom-scrollbar">
                        <div *ngFor="let comp of components" class="flex items-center justify-between p-3 border border-blue-900/30 rounded-lg bg-[#1B264F]">
                          <label class="flex items-center gap-3 cursor-pointer flex-1">
                            <input type="checkbox" 
                                   [checked]="isComponentSelected(comp._id!)"
                                   (change)="toggleComponentSelection(comp._id!)"
                                   class="rounded bg-[#0D1B35] border-blue-900/30 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
                            <div>
                              <span class="text-sm font-medium text-slate-200">{{ comp.name }}</span>
                              <span class="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                                  [class.bg-green-500_10]="comp.type === 'earning'"
                                  [class.text-green-400]="comp.type === 'earning'"
                                  [class.bg-red-500_10]="comp.type === 'deduction'"
                                  [class.text-red-400]="comp.type === 'deduction'">
                                {{ comp.type }}
                              </span>
                            </div>
                          </label>
                          <div *ngIf="isComponentSelected(comp._id!)" class="flex items-center gap-2">
                            <span class="text-xs text-slate-500">Override:</span>
                            <input type="number" 
                                   [value]="getOverrideValue(comp._id!)"
                                   (input)="updateOverrideValue(comp._id!, $event)"
                                   placeholder="Leave blank for Default"
                                   class="w-32 bg-[#0D1B35] border border-blue-900/30 rounded-lg px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none">
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="mt-6 flex gap-3 justify-end pt-4 border-t border-blue-900/30">
                    <button type="button" (click)="closeTemplateModal()" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-transparent hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" [disabled]="templateForm.invalid || isSubmitting" class="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors">
                      {{ isSubmitting ? 'Saving...' : 'Save Template' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- Assignments Tab -->
          <div *ngIf="activeTab === 'assignments'" class="space-y-6">
            <h2 class="text-xl font-bold">User Assignments</h2>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- User List (Left Sidebar) -->
              <div class="bg-[#1B264F] rounded-xl border border-blue-900/30 p-4 col-span-1 flex flex-col max-h-[70vh]">
                <div class="mb-4">
                  <input type="text" [(ngModel)]="userSearchTerm" placeholder="Search employee..." class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                  <div *ngFor="let u of filteredUsers" 
                       (click)="selectUserForAssignment(u)"
                       class="p-3 rounded-lg border cursor-pointer transition-colors"
                       [class.bg-blue-600_20]="selectedUser?._id === u._id"
                       [class.border-blue-500]="selectedUser?._id === u._id"
                       [class.bg-[#0D1B35]]="selectedUser?._id !== u._id"
                       [class.border-blue-900_30]="selectedUser?._id !== u._id"
                       [class.hover:border-blue-700]="selectedUser?._id !== u._id">
                    <p class="font-semibold text-sm">{{ u.firstName }} {{ u.lastName }}</p>
                    <p class="text-[10px] text-slate-400">{{ u.email }} • <span class="uppercase">{{ u.role }}</span></p>
                    <div class="mt-2 text-xs">
                      <span *ngIf="u.salaryTemplate" class="text-green-400 flex items-center gap-1">
                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        Assigned
                      </span>
                      <span *ngIf="!u.salaryTemplate" class="text-orange-400">Unassigned</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Assignment Editor (Right Area) -->
              <div class="bg-[#1B264F] rounded-xl border border-blue-900/30 p-5 col-span-1 lg:col-span-2">
                <div *ngIf="!selectedUser" class="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                  <svg class="h-16 w-16 mb-4 text-blue-900/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p>Select an employee from the list to manage their payroll template.</p>
                </div>

                <div *ngIf="selectedUser" class="space-y-6">
                  <div class="border-b border-blue-900/30 pb-4">
                    <h3 class="text-xl font-bold text-white">{{ selectedUser.firstName }} {{ selectedUser.lastName }}</h3>
                    <p class="text-sm text-slate-400">{{ selectedUser.department }} | {{ selectedUser.designation }}</p>
                  </div>

                  <form [formGroup]="assignmentForm" (ngSubmit)="saveAssignment()">
                    <div class="space-y-4">
                      <div>
                        <label class="block text-xs font-semibold text-slate-400 mb-1">Select Salary Template *</label>
                        <select formControlName="templateId" (change)="onTemplateChange()" class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                          <option value="">-- Choose a Template --</option>
                          <option *ngFor="let t of templates" [value]="t._id">{{ t.name }}</option>
                        </select>
                      </div>

                      <!-- Overrides Section -->
                      <div *ngIf="assignmentForm.get('templateId')?.value" class="mt-6">
                        <h4 class="text-sm font-bold text-slate-300 mb-3">Employee Specific Overrides</h4>
                        <p class="text-xs text-slate-500 mb-4">Values defined here will override the template's default calculation for this specific employee.</p>
                        
                        <div class="space-y-3 bg-[#0D1B35] p-4 rounded-xl border border-blue-900/20">
                          <div *ngFor="let c of getSelectedTemplateComponents()" class="flex items-center justify-between p-3 border border-blue-900/30 rounded-lg bg-[#1B264F]">
                            <div>
                              <span class="text-sm font-medium text-slate-200">{{ c.name }}</span>
                              <p class="text-[10px] text-slate-500 mt-0.5">Assigned via Template</p>
                            </div>
                            <div class="flex items-center gap-2">
                              <span class="text-xs text-slate-500">Override Amount:</span>
                              <input type="number" 
                                     [value]="getUserOverrideValue(c._id)"
                                     (input)="updateUserOverrideValue(c._id, $event)"
                                     placeholder="Blank = Use Template"
                                     class="w-32 bg-[#0D1B35] border border-blue-900/30 rounded-lg px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none">
                            </div>
                          </div>
                          <div *ngIf="getSelectedTemplateComponents().length === 0" class="text-center text-xs text-slate-500 py-4">
                            No components in this template.
                          </div>
                        </div>
                      </div>

                      <div>
                        <label class="block text-xs font-semibold text-slate-400 mb-1 mt-4">Revision Reason *</label>
                        <input formControlName="reason" type="text" class="w-full bg-[#0D1B35] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none placeholder-slate-600" placeholder="e.g. Annual Appraisal, Joining Setup">
                      </div>
                    </div>

                    <div class="mt-6 flex justify-end">
                      <button type="submit" [disabled]="assignmentForm.invalid || isSubmitting" class="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-lg">
                        {{ isSubmitting ? 'Applying...' : 'Apply & Save Revision' }}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    .bg-green-500_10 { background-color: rgba(34, 197, 94, 0.1); }
    .bg-red-500_10 { background-color: rgba(239, 68, 68, 0.1); }
    .bg-blue-600_20 { background-color: rgba(37, 99, 235, 0.2); }
    .border-blue-900_30 { border-color: rgba(30, 58, 138, 0.3); }
  `]
})
export class PayrollSettingsComponent implements OnInit {
  activeTab: 'components' | 'templates' | 'assignments' = 'components';
  
  components: SalaryComponent[] = [];
  templates: SalaryTemplate[] = [];
  
  // Component Form State
  showComponentModal = false;
  componentForm!: FormGroup;
  editingComponentId: string | null = null;
  
  // Template Form State
  showTemplateModal = false;
  templateForm!: FormGroup;
  editingTemplateId: string | null = null;
  selectedTemplateComponents: { componentId: string, overrideAmount: number | null }[] = [];

  // Assignment State
  users: any[] = [];
  userSearchTerm = '';
  selectedUser: any = null;
  assignmentForm!: FormGroup;
  userOverrides: { componentId: string, overrideAmount: number | null }[] = [];

  isSubmitting = false;

  constructor(
    private payrollService: PayrollService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.initComponentForm();
    this.initTemplateForm();
    this.initAssignmentForm();
    this.loadComponents();
    this.loadTemplates();
    this.loadUsers();
  }

  // --- COMPONENT LOGIC ---

  initComponentForm() {
    this.componentForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      type: ['earning', Validators.required],
      calculationType: ['flat', Validators.required],
      amountOrPercentage: [0, [Validators.required, Validators.min(0)]],
      percentageOf: [null],
      isTaxable: [true],
      isStatutory: [false],
      isPartOfGross: [true],
      dependsOnAttendance: [true],
      isActive: [true]
    });
  }

  loadComponents() {
    this.payrollService.getComponents().subscribe({
      next: (res) => this.components = res,
      error: (err) => console.error('Failed to load components', err)
    });
  }

  loadTemplates() {
    this.payrollService.getTemplates().subscribe({
      next: (res) => this.templates = res,
      error: (err) => console.error('Failed to load templates', err)
    });
  }

  openComponentModal() {
    this.editingComponentId = null;
    this.componentForm.reset({
      type: 'earning',
      calculationType: 'flat',
      amountOrPercentage: 0,
      percentageOf: null,
      isTaxable: true,
      isStatutory: false,
      isPartOfGross: true,
      dependsOnAttendance: true,
      isActive: true
    });
    this.showComponentModal = true;
  }

  editComponent(comp: SalaryComponent) {
    this.editingComponentId = comp._id || null;
    this.componentForm.patchValue({
      name: comp.name,
      description: comp.description,
      type: comp.type,
      calculationType: comp.calculationType,
      amountOrPercentage: comp.amountOrPercentage,
      percentageOf: comp.percentageOf ? (comp.percentageOf as any)._id : null,
      isTaxable: comp.isTaxable,
      isStatutory: comp.isStatutory,
      isPartOfGross: comp.isPartOfGross,
      dependsOnAttendance: comp.dependsOnAttendance,
      isActive: comp.isActive
    });
    this.showComponentModal = true;
  }

  closeComponentModal() {
    this.showComponentModal = false;
  }

  saveComponent() {
    if (this.componentForm.invalid) return;
    this.isSubmitting = true;
    
    // Convert string 'null' to actual null for percentageOf
    const val = this.componentForm.value;
    if (val.percentageOf === 'null' || !val.percentageOf) {
      val.percentageOf = null;
    }

    const obs = this.editingComponentId
      ? this.payrollService.updateComponent(this.editingComponentId, val)
      : this.payrollService.createComponent(val);

    obs.subscribe({
      next: () => {
        this.loadComponents();
        this.closeComponentModal();
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Failed to save component', err);
        this.isSubmitting = false;
      }
    });
  }

  // --- TEMPLATE LOGIC ---
  initTemplateForm() {
    this.templateForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      isDefaultTemplate: [false],
      isActive: [true]
    });
  }

  getComponentName(compRef: any): string {
    if (typeof compRef === 'string') {
      const c = this.components.find(x => x._id === compRef);
      return c ? c.name : 'Unknown';
    }
    return compRef?.name || 'Unknown';
  }

  openTemplateModal() {
    this.editingTemplateId = null;
    this.selectedTemplateComponents = [];
    this.templateForm.reset({
      isDefaultTemplate: false,
      isActive: true
    });
    this.showTemplateModal = true;
  }

  editTemplate(tpl: SalaryTemplate) {
    this.editingTemplateId = tpl._id || null;
    this.templateForm.patchValue({
      name: tpl.name,
      description: tpl.description,
      isDefaultTemplate: tpl.isDefaultTemplate,
      isActive: tpl.isActive
    });
    
    // Map existing components
    this.selectedTemplateComponents = tpl.components.map(c => ({
      componentId: typeof c.component === 'string' ? c.component : c.component._id!,
      overrideAmount: c.overrideAmount ?? null
    }));

    this.showTemplateModal = true;
  }

  closeTemplateModal() {
    this.showTemplateModal = false;
  }

  isComponentSelected(id: string): boolean {
    return this.selectedTemplateComponents.some(c => c.componentId === id);
  }

  toggleComponentSelection(id: string) {
    const idx = this.selectedTemplateComponents.findIndex(c => c.componentId === id);
    if (idx > -1) {
      this.selectedTemplateComponents.splice(idx, 1);
    } else {
      this.selectedTemplateComponents.push({ componentId: id, overrideAmount: null });
    }
  }

  getOverrideValue(id: string): any {
    const c = this.selectedTemplateComponents.find(x => x.componentId === id);
    return c ? c.overrideAmount : null;
  }

  updateOverrideValue(id: string, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    const c = this.selectedTemplateComponents.find(x => x.componentId === id);
    if (c) {
      c.overrideAmount = val !== '' ? parseFloat(val) : null;
    }
  }

  saveTemplate() {
    if (this.templateForm.invalid) return;
    this.isSubmitting = true;
    
    const val = this.templateForm.value;
    
    // Format payload
    const payload: Partial<SalaryTemplate> = {
      ...val,
      components: this.selectedTemplateComponents.map(c => {
        const item: any = { component: c.componentId };
        if (c.overrideAmount !== null && !isNaN(c.overrideAmount)) {
          item.overrideAmount = c.overrideAmount;
        }
        return item;
      })
    };

    const obs = this.editingTemplateId
      ? this.payrollService.updateTemplate(this.editingTemplateId, payload)
      : this.payrollService.createTemplate(payload);

    obs.subscribe({
      next: () => {
        this.loadTemplates();
        this.closeTemplateModal();
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Failed to save template', err);
        this.isSubmitting = false;
      }
    });
  }

  // --- ASSIGNMENT LOGIC ---
  loadUsers() {
    this.authService.getUsers().subscribe({
      next: (res) => this.users = res,
      error: (err) => console.error('Failed to load users', err)
    });
  }

  get filteredUsers() {
    if (!this.userSearchTerm) return this.users;
    const s = this.userSearchTerm.toLowerCase();
    return this.users.filter(u => 
      u.firstName?.toLowerCase().includes(s) || 
      u.lastName?.toLowerCase().includes(s) || 
      u.email?.toLowerCase().includes(s)
    );
  }

  initAssignmentForm() {
    this.assignmentForm = this.fb.group({
      templateId: ['', Validators.required],
      reason: ['', Validators.required]
    });
  }

  selectUserForAssignment(user: any) {
    this.selectedUser = user;
    this.userOverrides = [];
    
    let tplId = '';
    if (user.salaryTemplate) {
      tplId = typeof user.salaryTemplate === 'string' ? user.salaryTemplate : user.salaryTemplate._id;
    }
    
    this.assignmentForm.patchValue({
      templateId: tplId || '',
      reason: '' // Reset reason on new selection
    });

    if (user.salaryOverrides && Array.isArray(user.salaryOverrides)) {
      this.userOverrides = user.salaryOverrides.map((o: any) => ({
        componentId: typeof o.component === 'string' ? o.component : o.component._id,
        overrideAmount: o.overrideAmount
      }));
    }
  }

  onTemplateChange() {
    // When template changes, reset personal overrides
    this.userOverrides = [];
  }

  getSelectedTemplateComponents(): any[] {
    const tplId = this.assignmentForm.get('templateId')?.value;
    if (!tplId) return [];
    const tpl = this.templates.find(t => t._id === tplId);
    if (!tpl) return [];
    
    return tpl.components.map(c => {
      if (typeof c.component === 'string') {
        return this.components.find(comp => comp._id === c.component) || { _id: c.component, name: 'Unknown' };
      }
      return c.component;
    });
  }

  getUserOverrideValue(compId: string): any {
    const override = this.userOverrides.find(o => o.componentId === compId);
    return override ? override.overrideAmount : null;
  }

  updateUserOverrideValue(compId: string, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    const idx = this.userOverrides.findIndex(o => o.componentId === compId);
    
    if (val === '') {
      if (idx > -1) this.userOverrides.splice(idx, 1);
    } else {
      if (idx > -1) {
        this.userOverrides[idx].overrideAmount = parseFloat(val);
      } else {
        this.userOverrides.push({ componentId: compId, overrideAmount: parseFloat(val) });
      }
    }
  }

  saveAssignment() {
    if (this.assignmentForm.invalid || !this.selectedUser) return;
    this.isSubmitting = true;

    const payload = {
      userId: this.selectedUser._id,
      newTemplate: this.assignmentForm.value.templateId,
      newOverrides: this.userOverrides.map(o => ({
        component: o.componentId,
        overrideAmount: o.overrideAmount
      })),
      reason: this.assignmentForm.value.reason,
      effectiveDate: new Date().toISOString()
    };

    this.payrollService.reviseSalary(payload).subscribe({
      next: (res) => {
        // Update local user object
        this.selectedUser.salaryTemplate = res.user.salaryTemplate;
        this.selectedUser.salaryOverrides = res.user.salaryOverrides;
        
        // Find and update in the array
        const idx = this.users.findIndex(u => u._id === this.selectedUser._id);
        if (idx > -1) this.users[idx] = this.selectedUser;
        
        this.isSubmitting = false;
        this.assignmentForm.get('reason')?.reset();
        
        // Show success alert? (could use a toast system)
        alert('Salary assignment revised successfully!');
      },
      error: (err) => {
        console.error('Failed to revise salary', err);
        this.isSubmitting = false;
        alert('Failed to revise salary. Please check console.');
      }
    });
  }
}
