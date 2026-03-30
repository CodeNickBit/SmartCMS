import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ManagerService } from '../../../services/manager.service';
import { HRService } from '../../../services/hr.service';
import { EmailVerificationModalComponent } from '../../../components/email-verification-modal.component';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, EmailVerificationModalComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="onBackdropClick($event)">
      <div class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in text-slate-600 light:text-[#3D5A7A] dark:text-slate-300">
        <!-- Header -->
        <div class="p-6 border-b border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 flex items-center justify-between bg-white/5">
          <h2 class="text-xl font-bold text-slate-800 light:text-[#0D1B35] dark:text-white flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-[#3083DC]/20 flex items-center justify-center text-[#3083DC] border border-[#3083DC]/30">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {{ isEditing ? 'Edit Profile' : 'My Profile' }}
          </h2>
          <button (click)="onClose()" class="p-2 rounded-lg hover:bg-white/10 text-slate-500 light:text-[#7A96B2] dark:text-slate-400 hover:text-white transition-colors" [disabled]="isSaving">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <!-- Profile Header -->
          <div class="flex items-center gap-6 mb-8">
             <div class="h-24 w-24 rounded-2xl bg-[#3083DC]/20 flex items-center justify-center text-[#3083DC] text-[#246bb6] light:text-[#1A6DC2] dark:text-[#3083DC]xl font-bold border border-[#3083DC]/30 shadow-lg">
                {{ getInitials(user?.name || user?.firstName) }}
            </div>
            <div>
              <h3 class="text-2xl font-bold text-slate-800 light:text-[#0D1B35] dark:text-white">{{ user?.name || (user?.firstName + ' ' + user?.lastName) }}</h3>
              <p class="text-[#3083DC] font-medium mt-1">{{ user?.role | titlecase }}</p>
              <div class="flex items-center gap-2 mt-2 text-sm text-slate-500 light:text-[#7A96B2] dark:text-slate-400">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {{ user?.email }}
              </div>
            </div>
          </div>

          <!-- Alert Messages -->
          <div *ngIf="message" [class]="'mb-6 p-4 rounded-lg border flex items-start gap-3 ' + (isSuccess ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400')">
            <svg class="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path *ngIf="isSuccess" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path *ngIf="!isSuccess" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm font-medium">{{ message }}</p>
          </div>

          <!-- Details Grid -->
          <div class="space-y-8">
            
            <!-- Employee View -->
            <ng-container *ngIf="['employee'].includes(user?.role?.toLowerCase()) || !user?.role">
              <!-- Personal Information -->
              <div>
                <h4 class="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 pb-2 mb-4">Personal Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">First Name <span *ngIf="isEditing" class="text-rose-400">*</span></label>
                    <div *ngIf="!isEditing" class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">{{ user?.firstName || 'N/A' }}</div>
                    <input *ngIf="isEditing" type="text" [(ngModel)]="editData.firstName" class="w-full p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3083DC] transition-all" placeholder="First Name">
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Last Name <span *ngIf="isEditing" class="text-rose-400">*</span></label>
                    <div *ngIf="!isEditing" class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">{{ user?.lastName || 'N/A' }}</div>
                    <input *ngIf="isEditing" type="text" [(ngModel)]="editData.lastName" class="w-full p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3083DC] transition-all" placeholder="Last Name">
                  </div>
                  <!-- Email is editable for some roles so we embed the edit logic here or below -->
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Email Address <span *ngIf="isEditing" class="text-rose-400">*</span></label>
                    <div *ngIf="!isEditing" class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium font-mono">{{ user?.email || 'N/A' }}</div>
                    <input *ngIf="isEditing" type="email" [(ngModel)]="editData.email" class="w-full p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3083DC] transition-all" placeholder="Enter Email">
                    <p *ngIf="isEditing" class="text-xs text-[#3083DC] mt-1 pl-1">Changing email requires OTP verification.</p>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Phone Number</label>
                    <div *ngIf="!isEditing" class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">{{ user?.phone || 'N/A' }}</div>
                    <input *ngIf="isEditing" type="tel" [(ngModel)]="editData.phone" class="w-full p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3083DC] transition-all" placeholder="Phone Number">
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Gender <span *ngIf="!isEditing && user?.age">/ Age</span></label>
                    <div *ngIf="!isEditing" class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">{{ user?.gender || 'N/A' }} <span *ngIf="user?.age">({{ user?.age }}y)</span></div>
                    <select *ngIf="isEditing" [(ngModel)]="editData.gender" class="w-full p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-800 light:text-[#0D1B35] dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-[#3083DC] transition-all">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Date of Birth</label>
                    <div *ngIf="!isEditing" class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">{{ user?.dateOfBirth ? (user.dateOfBirth | date:'mediumDate') : 'N/A' }}</div>
                    <input *ngIf="isEditing" type="date" [(ngModel)]="editData.dateOfBirth" class="w-full p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3083DC] transition-all filter-none">
                  </div>
                  <div class="space-y-1 md:col-span-2">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Current Address</label>
                    <div *ngIf="!isEditing" class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium text-sm">{{ user?.currentAddress || 'N/A' }}</div>
                    <textarea *ngIf="isEditing" [(ngModel)]="editData.currentAddress" rows="2" class="w-full p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3083DC] transition-all" placeholder="Enter Current Address"></textarea>
                  </div>
                  <div class="space-y-1 md:col-span-2">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Permanent Address</label>
                    <div *ngIf="!isEditing" class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium text-sm">{{ user?.permanentAddress || 'N/A' }}</div>
                    <textarea *ngIf="isEditing" [(ngModel)]="editData.permanentAddress" rows="2" class="w-full p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3083DC] transition-all" placeholder="Enter Permanent Address"></textarea>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Emergency Contact Name</label>
                    <div *ngIf="!isEditing" class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">{{ user?.emergencyContactName || 'N/A' }}</div>
                    <input *ngIf="isEditing" type="text" [(ngModel)]="editData.emergencyContactName" class="w-full p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3083DC] transition-all" placeholder="Emergency Contact Name">
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Emergency Number</label>
                    <div *ngIf="!isEditing" class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">{{ user?.emergencyContactNumber || 'N/A' }}</div>
                    <input *ngIf="isEditing" type="tel" [(ngModel)]="editData.emergencyContactNumber" class="w-full p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3083DC] transition-all" placeholder="Emergency Number">
                  </div>
                </div>
              </div>

              <!-- Employment Information -->
              <div>
                <h4 class="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 pb-2 mb-4 mt-6">Employment Details</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Employee ID</label>
                    <div class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium font-mono">{{ user?.employeeId || 'N/A' }}</div>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Reporting Manager</label>
                    <div class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">{{ user?.reportingManager || 'N/A' }}</div>
                  </div>
                  
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Department</label>
                    <div class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">{{ user?.department || 'N/A' }}</div>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Designation</label>
                    <div class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">{{ user?.designation || 'N/A' }}</div>
                  </div>

                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Date of Joining</label>
                    <div class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">{{ user?.joiningDate ? (user.joiningDate | date:'mediumDate') : 'N/A' }}</div>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Employment Type</label>
                    <div class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">{{ user?.employmentType || 'N/A' }}</div>
                  </div>
                  
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Work Location</label>
                    <div class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">{{ user?.workLocation || 'N/A' }}</div>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Shift / Working Days</label>
                    <div class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium text-sm">
                      {{ user?.shiftType || 'N/A' }} <span *ngIf="user?.weeklyWorkingDays" class="text-slate-500 light:text-[#7A96B2] dark:text-slate-400">(- {{ user.weeklyWorkingDays }} Days)</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Financial & Benefits -->
              <div>
                <h4 class="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 pb-2 mb-4 mt-6">Financial & Benefits</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Bank Name & IFSC</label>
                    <div class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">
                      {{ user?.bankName || 'N/A' }} <span *ngIf="user?.bankIFSC" class="text-slate-500 light:text-[#7A96B2] dark:text-slate-400">({{ user.bankIFSC }})</span>
                    </div>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Account Number</label>
                    <div class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium font-mono text-sm tracking-wider">{{ user?.bankAccountNumber || 'N/A' }}</div>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">PF Applicable</label>
                    <div class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">
                      <span [class]="user?.pfApplicable ? 'text-emerald-400' : 'text-slate-500 light:text-[#7A96B2] dark:text-slate-400'">{{ user?.pfApplicable ? 'Yes' : 'No' }}</span>
                    </div>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">ESIC Applicable</label>
                     <div class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">
                      <span [class]="user?.esicApplicable ? 'text-emerald-400' : 'text-slate-500 light:text-[#7A96B2] dark:text-slate-400'">{{ user?.esicApplicable ? 'Yes' : 'No' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ng-container>

            <!-- Manager / HR View -->
            <ng-container *ngIf="['manager', 'hr'].includes(user?.role?.toLowerCase())">
              <div>
                <h4 class="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 pb-2 mb-4">Profile Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Department <span *ngIf="isEditing" class="text-rose-400">*</span></label>
                    <div *ngIf="!isEditing" class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">
                      {{ user?.department || 'N/A' }}
                    </div>
                    <input *ngIf="isEditing" type="text" [(ngModel)]="editData.department" 
                      class="w-full p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3083DC] transition-all"
                      placeholder="Enter Department">
                  </div>

                  <div class="space-y-1" *ngIf="user?.role !== 'hr'">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Designation <span *ngIf="isEditing" class="text-rose-400">*</span></label>
                    <div *ngIf="!isEditing" class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium">
                      {{ user?.designation || 'N/A' }}
                    </div>
                    <input *ngIf="isEditing" type="text" [(ngModel)]="editData.designation" 
                      class="w-full p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3083DC] transition-all"
                      placeholder="Enter Designation">
                  </div>

                  <div class="space-y-1">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Email Address <span *ngIf="isEditing" class="text-rose-400">*</span></label>
                    <div *ngIf="!isEditing" class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium font-mono">
                      {{ user?.email || 'N/A' }}
                    </div>
                    <input *ngIf="isEditing" type="email" [(ngModel)]="editData.email" 
                      class="w-full p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-[#3083DC] transition-all"
                      placeholder="Enter Email">
                    <p *ngIf="isEditing" class="text-xs text-[#3083DC] mt-1 pl-1">Changing email requires OTP verification.</p>
                  </div>

                  <div class="space-y-1" *ngIf="user?.joiningDate">
                    <label class="text-xs font-semibold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase">Date of Joining</label>
                    <div class="p-3 rounded-lg bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-blue-900/20 text-slate-800 light:text-[#0D1B35] dark:text-white font-medium opacity-60 cursor-not-allowed">
                      {{ user?.joiningDate | date:'mediumDate' }}
                    </div>
                  </div>
                  
                </div>
              </div>
            </ng-container>

          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 bg-slate-50 light:bg-[#EEF3FA]/30 dark:bg-[#101935]/30 flex justify-end gap-3">
            <ng-container *ngIf="!isEditing">
              <button (click)="toggleEdit()" class="px-6 py-2.5 rounded-lg bg-[#3083DC] hover:bg-[#206bc4] text-slate-800 light:text-[#0D1B35] dark:text-white font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
              </button>
            </ng-container>

            <ng-container *ngIf="isEditing">
              <button (click)="cancelEdit()" class="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:bg-slate-700/50 text-slate-600 light:text-[#3D5A7A] dark:text-slate-300 font-bold transition-all" [disabled]="isSaving">
                Cancel
              </button>
              <button (click)="checkEmailAndSave()" class="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-slate-800 light:text-[#0D1B35] dark:text-white font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2" [disabled]="isSaving">
                <svg *ngIf="isSaving" class="animate-spin h-4 w-4 text-slate-800 light:text-[#0D1B35] dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isSaving ? 'Saving...' : 'Save Changes' }}
              </button>
            </ng-container>
        </div>
      </div>
    </div>

    <!-- Email Verification Modal -->
    <app-email-verification-modal 
        *ngIf="showOtpModal" 
        [email]="editData.email"
        (verified)="onEmailVerified($event)" 
        (closed)="closeOtpModal()">
    </app-email-verification-modal>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
      animation: fade-in 0.2s ease-out;
    }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #101935; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3083DC; }
  `]
})
export class ProfileModalComponent {
  @Input() user: any;
  @Output() close = new EventEmitter<void>();

  isEditing: boolean = false;
  isSaving: boolean = false;
  editData: any = {};
  message: string = '';
  isSuccess: boolean = false;

  showOtpModal: boolean = false;

  constructor(
    private authService: AuthService,
    private managerService: ManagerService,
    private hrService: HRService
  ) { }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement) === event.currentTarget && !this.isEditing) {
      this.close.emit();
    }
  }

  onClose() {
    if (!this.isEditing) {
      this.close.emit();
    } else {
      this.cancelEdit();
    }
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }

  toggleEdit() {
    this.isEditing = true;
    this.message = '';
    // Deep copy specific fields to avoid reference issues
    this.editData = {
      department: this.user.department,
      designation: this.user.designation,
      email: this.user.email,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      phone: this.user.phone,
      gender: this.user.gender,
      dateOfBirth: this.user.dateOfBirth,
      currentAddress: this.user.currentAddress,
      permanentAddress: this.user.permanentAddress,
      emergencyContactName: this.user.emergencyContactName,
      emergencyContactNumber: this.user.emergencyContactNumber
    };
  }

  cancelEdit() {
    this.isEditing = false;
    this.editData = {};
    this.message = '';
  }

  checkEmailAndSave() {
    const role = this.user?.role?.toLowerCase();

    // Field Validation based on Role
    if (role === 'employee' || !role) {
      if (!this.editData.firstName || !this.editData.lastName || !this.editData.email) {
        this.message = 'First Name, Last Name and Email are required.';
        this.isSuccess = false;
        return;
      }
    } else if (role !== 'hr') { // Manager
      if (!this.editData.department || !this.editData.designation || !this.editData.email) {
        this.message = 'All fields are required.';
        this.isSuccess = false;
        return;
      }
    } else { // HR
      if (!this.editData.department || !this.editData.email) {
        this.message = 'Department and Email are required.';
        this.isSuccess = false;
        return;
      }
    }


    if (this.editData.email !== this.user.email) {
      // Email Changed - Trigger OTP
      this.showOtpModal = true;
    } else {
      // Email Not Changed - Save directly
      this.saveProfile();
    }
  }

  closeOtpModal() {
    this.showOtpModal = false;
  }

  onEmailVerified(otp: string) {
    this.showOtpModal = false;
    // Proceed to save with proven ownership
    this.saveProfile();
  }

  saveProfile() {
    this.isSaving = true;
    this.message = '';
    const userId = this.user._id || this.user.id;
    const userRole = this.user.role;

    let updateObservable;

    if (userRole === 'manager') {
      updateObservable = this.managerService.updateManager(userId, this.editData);
    } else if (userRole === 'hr') {
      updateObservable = this.hrService.updateHR(userId, this.editData);
    } else {
      // Default to generic user update for other roles
      updateObservable = this.authService.updateUser(userId, this.editData);
    }

    updateObservable.subscribe({
      next: (updatedUser: any) => {
        this.isSaving = false;
        this.isSuccess = true;
        this.message = 'Profile updated successfully!';

        // Update local user object
        this.user.department = this.editData.department;
        if (this.editData.designation) {
          this.user.designation = this.editData.designation;
        }
        this.user.email = this.editData.email;

        // Map personal fields back if employee
        const role = this.user?.role?.toLowerCase();
        if (role === 'employee' || !role) {
          this.user.firstName = this.editData.firstName;
          this.user.lastName = this.editData.lastName;
          this.user.phone = this.editData.phone;
          this.user.gender = this.editData.gender;
          this.user.dateOfBirth = this.editData.dateOfBirth;
          this.user.currentAddress = this.editData.currentAddress;
          this.user.permanentAddress = this.editData.permanentAddress;
          this.user.emergencyContactName = this.editData.emergencyContactName;
          this.user.emergencyContactNumber = this.editData.emergencyContactNumber;
        }

        // Update local storage
        this.authService.setUser(this.user);

        setTimeout(() => {
          this.isEditing = false;
          this.message = '';
        }, 1500);
      },
      error: (error: any) => {
        this.isSaving = false;
        this.isSuccess = false;
        this.message = error.error?.message || 'Failed to update profile. Please try again.';
      }
    });
  }
}
