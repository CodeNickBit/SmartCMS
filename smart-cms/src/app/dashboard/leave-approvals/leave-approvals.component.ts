import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LeavePolicyService, LeaveRequest } from '../../services/leave-policy.service';

import { SharedSidebarComponent } from '../components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../components/header/header.component';
import { ConfirmationModalService } from '../../shared/confirmation-modal.service';

@Component({
  selector: 'app-leave-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] text-slate-800 light:text-[#0D1B35] dark:text-white font-sans overflow-hidden">
      <app-shared-sidebar class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header [notificationCount]="pendingLeaveNotificationsCount" (notificationClick)="toggleNotifications()"></app-shared-header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar">
          
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] p-6 rounded-2xl border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 light:text-[#0D1B35] dark:text-white">Leave Approvals</h2>
          <p class="text-slate-500 light:text-[#7A96B2] dark:text-slate-400">Manage leave requests from your team</p>
        </div>
      </div>

      <!-- Requests List -->
      <div class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-2xl overflow-hidden shadow-lg">
        <div class="p-6 border-b border-blue-900/20">
          <h3 class="text-lg font-bold text-slate-800 light:text-[#0D1B35] dark:text-white flex items-center gap-2">
            <span class="h-2 w-2 bg-[#3083DC] rounded-full"></span>
            Pending Requests
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] text-xs uppercase text-slate-500 light:text-[#7A96B2] dark:text-slate-400 font-semibold border-b border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30">
              <tr>
                <th class="px-6 py-4">Employee</th>
                <th class="px-6 py-4">Leave Type</th>
                <th class="px-6 py-4">Dates</th>
                <th class="px-6 py-4">Reason</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-blue-900/20">
              <tr *ngFor="let request of leaveRequests" (click)="openDetail(request)"
                class="hover:bg-white/5 transition-colors cursor-pointer">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="h-8 w-8 rounded-full bg-[#3083DC]/20 flex items-center justify-center text-[#3083DC] font-bold text-xs">
                      {{ (request.userDetails?.firstName ?? request.userDetails?.lastName ?? 'U').toString().charAt(0) }}
                    </div>
                    <div>
                      <div class="font-bold text-slate-800 light:text-[#0D1B35] dark:text-white">{{ request.userDetails?.firstName || '' }} {{ request.userDetails?.lastName || '' }}</div>
                      <div class="text-xs text-slate-500 light:text-[#7A96B2] dark:text-slate-400">{{ request.userDetails?.designation || 'Employee' }} &bull; {{ request.userDetails?.department || '' }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-slate-600 light:text-[#3D5A7A] dark:text-slate-300">{{ request.leaveType }}</td>
                <td class="px-6 py-4 text-slate-600 light:text-[#3D5A7A] dark:text-slate-300">
                  <div class="flex flex-col">
                    <span>{{ (request.startDate | date:'mediumDate') || request.startDate }}</span>
                    <span class="text-xs text-slate-500">to {{ (request.endDate | date:'mediumDate') || request.endDate }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-slate-500 light:text-[#7A96B2] dark:text-slate-400 max-w-xs truncate" title="{{ request.reason }}">{{ request.reason }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
                    [ngClass]="{
                      'bg-amber-500/20 text-amber-500': request.status === 'Pending',
                      'bg-emerald-500/20 text-emerald-500': request.status === 'Approved',
                      'bg-rose-500/20 text-rose-500': request.status === 'Rejected'
                    }">
                    {{ request.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-xs text-slate-500 light:text-[#7A96B2] dark:text-slate-400">Click row for details</span>
                </td>
              </tr>
              <tr *ngIf="leaveRequests.length === 0">
                <td colspan="6" class="px-6 py-8 text-center text-slate-500 italic">No leave requests found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Detail & Action Modal -->
    <div *ngIf="showDetailModal && selectedRequest" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" (click)="closeDetail()"></div>
      <div class="relative bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-blue-900/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div class="px-6 py-4 border-b border-blue-900/50 bg-slate-50 light:bg-[#EEF3FA]/50 dark:bg-[#101935]/50 flex justify-between items-center">
          <h3 class="text-lg font-bold text-slate-800 light:text-[#0D1B35] dark:text-white">Leave Request Details</h3>
          <button (click)="closeDetail()" class="text-slate-500 light:text-[#7A96B2] dark:text-slate-400 hover:text-white p-1 rounded">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto space-y-4" *ngIf="detailConfirmMode === 'view' || detailConfirmMode === 'approve'">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-[#3083DC]/20 flex items-center justify-center text-[#3083DC] font-bold">
              {{ (selectedRequest.userDetails?.firstName ?? selectedRequest.userDetails?.lastName ?? 'U').toString().charAt(0) }}
            </div>
            <div>
              <div class="font-bold text-slate-800 light:text-[#0D1B35] dark:text-white">{{ selectedRequest.userDetails?.firstName || '' }} {{ selectedRequest.userDetails?.lastName || '' }}</div>
              <div class="text-xs text-slate-500 light:text-[#7A96B2] dark:text-slate-400">{{ selectedRequest.userDetails?.designation || 'Employee' }} &bull; {{ selectedRequest.userDetails?.department || '' }}</div>
            </div>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase tracking-wider">Leave Type</span>
            <p class="text-slate-800 light:text-[#0D1B35] dark:text-white font-medium mt-0.5">{{ selectedRequest.leaveType }}</p>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase tracking-wider">Dates</span>
            <p class="text-slate-600 light:text-[#3D5A7A] dark:text-slate-300 mt-0.5">{{ selectedRequest.startDate | date:'mediumDate' }} – {{ selectedRequest.endDate | date:'mediumDate' }}</p>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase tracking-wider">Reason</span>
            <p class="text-slate-600 light:text-[#3D5A7A] dark:text-slate-300 mt-0.5 whitespace-pre-wrap break-words">{{ selectedRequest.reason }}</p>
          </div>
          <div *ngIf="selectedRequest.status === 'Rejected' && selectedRequest.rejectionReason">
            <span class="text-xs font-bold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase tracking-wider">Rejection Reason</span>
            <p class="text-rose-300/90 mt-0.5 whitespace-pre-wrap break-words">{{ selectedRequest.rejectionReason }}</p>
          </div>
          <div *ngIf="detailConfirmMode === 'approve'" class="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
            <p class="text-amber-200 text-sm font-medium mb-3">Approve this leave request?</p>
            <div class="flex justify-end gap-2">
              <button (click)="detailConfirmMode = 'view'" class="px-4 py-2 text-slate-600 light:text-[#3D5A7A] dark:text-slate-300 hover:text-white rounded-lg text-sm font-medium">Cancel</button>
              <button (click)="confirmApprove()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-800 light:text-[#0D1B35] dark:text-white rounded-lg text-sm font-bold">Yes, Approve</button>
            </div>
          </div>
        </div>
        <div class="p-6 overflow-y-auto space-y-4" *ngIf="detailConfirmMode === 'reject'">
          <div>
            <span class="text-xs font-bold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase tracking-wider">Reason for rejection</span>
            <textarea [(ngModel)]="rejectReasonInModal" rows="3" placeholder="Provide a reason for rejection..."
              class="w-full mt-1.5 bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-lg px-3 py-2.5 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button (click)="detailConfirmMode = 'view'" class="px-4 py-2 text-slate-600 light:text-[#3D5A7A] dark:text-slate-300 hover:text-white rounded-lg text-sm font-medium">Cancel</button>
            <button (click)="confirmReject()" [disabled]="!rejectReasonInModal.trim()"
              class="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:pointer-events-none text-slate-800 light:text-[#0D1B35] dark:text-white rounded-lg text-sm font-bold">Confirm Reject</button>
          </div>
        </div>

        <div class="p-6 overflow-y-auto space-y-4" *ngIf="detailConfirmMode === 'changes'">
          <div>
            <span class="text-xs font-bold text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase tracking-wider">Comments for Employee</span>
             <textarea [(ngModel)]="managerCommentsInModal" rows="3" placeholder="Explain what needs to be changed..."
              class="w-full mt-1.5 bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-lg px-3 py-2.5 text-slate-800 light:text-[#0D1B35] dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button (click)="detailConfirmMode = 'view'" class="px-4 py-2 text-slate-600 light:text-[#3D5A7A] dark:text-slate-300 hover:text-white rounded-lg text-sm font-medium">Cancel</button>
            <button (click)="confirmRequestChanges()" [disabled]="!managerCommentsInModal.trim()"
              class="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:pointer-events-none text-slate-800 light:text-[#0D1B35] dark:text-white rounded-lg text-sm font-bold">Send Request</button>
          </div>
        </div>

        <div class="px-6 py-4 bg-slate-50 light:bg-[#EEF3FA]/30 dark:bg-[#101935]/30 border-t border-blue-900/50 flex justify-end gap-2" *ngIf="detailConfirmMode === 'view' && selectedRequest.status === 'Pending'">
          <button (click)="detailConfirmMode = 'changes'" class="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm font-bold">Request Changes</button>
          <button (click)="detailConfirmMode = 'reject'" class="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-sm font-bold">Reject</button>
          <button (click)="detailConfirmMode = 'approve'" class="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-bold">Approve</button>
        </div>
        <div class="px-6 py-4 bg-slate-50 light:bg-[#EEF3FA]/30 dark:bg-[#101935]/30 border-t border-blue-900/50 flex justify-end" *ngIf="detailConfirmMode === 'view' && selectedRequest.status !== 'Pending'">
          <button (click)="closeDetail()" class="px-4 py-2 text-slate-600 light:text-[#3D5A7A] dark:text-slate-300 hover:text-white rounded-lg text-sm font-medium">Close</button>
        </div>
      </div>
    </div>

    <!-- Manager Notifications Drawer (same UI as employee) -->
    <div *ngIf="showNotifications" class="fixed inset-0 z-[60] overflow-hidden">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="toggleNotifications()"></div>
      <div class="absolute inset-y-0 right-0 max-w-sm w-full bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] shadow-2xl flex flex-col border-l border-blue-900/50">
        <div class="px-6 py-4 border-b border-blue-900/50 bg-slate-50 light:bg-[#EEF3FA]/50 dark:bg-[#101935]/50 flex justify-between items-center">
          <h2 class="text-lg font-bold text-slate-800 light:text-[#0D1B35] dark:text-white flex items-center gap-2">
            <svg class="h-5 w-5 text-[#3083DC]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Notifications
          </h2>
          <button (click)="toggleNotifications()" class="text-slate-500 light:text-[#7A96B2] dark:text-slate-400 hover:text-white"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <p class="text-xs text-slate-500 light:text-[#7A96B2] dark:text-slate-400 uppercase font-bold tracking-wider mb-2">Leave requests (acknowledgement only – use Leave Approvals to act)</p>
          <div *ngFor="let n of managerNotifications" class="p-4 rounded-xl border border-blue-900/20 bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] flex gap-3">
            <span class="flex items-center justify-center w-8 h-8 rounded-full bg-[#3083DC]/20 text-[#3083DC] flex-shrink-0">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </span>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-bold text-slate-800 light:text-[#0D1B35] dark:text-white">{{ n.title }}</h4>
              <p class="text-xs text-slate-500 light:text-[#7A96B2] dark:text-slate-400 mt-0.5">{{ n.message }}</p>
            </div>
          </div>
          <div *ngIf="managerNotifications.length === 0" class="py-8 text-center text-slate-500 text-sm">No new leave requests.</div>
        </div>
      </div>
    </div>
        </main>
      </div>
    </div>
  `
})
export class LeaveApprovalsComponent implements OnInit {
  leaveRequests: LeaveRequest[] = [];
  currentUser: any;
  showDetailModal = false;
  selectedRequest: any = null;
  detailConfirmMode: 'view' | 'approve' | 'reject' | 'changes' = 'view';
  rejectReasonInModal = '';
  managerCommentsInModal = '';
  showNotifications = false;

  get pendingLeaveNotificationsCount(): number {
    return this.leaveRequests.filter(r => r.status === 'Pending').length;
  }

  get managerNotifications(): { title: string; message: string }[] {
    return this.leaveRequests
      .filter(r => r.status === 'Pending')
      .map(r => {
        const first = (r.userDetails && r.userDetails.firstName) || '';
        const last = (r.userDetails && r.userDetails.lastName) || '';
        const name = (first + ' ' + last).trim() || 'Employee';
        const start = r.startDate ? new Date(r.startDate).toLocaleDateString() : '';
        const end = r.endDate ? new Date(r.endDate).toLocaleDateString() : '';
        return {
          title: 'Leave request from ' + name,
          message: r.leaveType + ': ' + start + ' to ' + end + '. Go to Leave Approvals to approve or reject.'
        };
      });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  constructor(
    private leaveService: LeavePolicyService,
    private authService: AuthService,
    private confirmationModal: ConfirmationModalService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    if (this.currentUser) {
      this.loadRequests();
    }
  }

  loadRequests(): void {
    const managerId = this.currentUser._id ?? this.currentUser.id;
    this.leaveService.getManagerLeaves(managerId).subscribe({
      next: (data) => {
        this.leaveRequests = (data || []).map((r: any) => ({
          ...r,
          userDetails: typeof r.userId === 'object' && r.userId != null ? r.userId : r.userDetails ?? null
        }));
      },
      error: (err) => console.error('Error loading leave requests', err)
    });
  }

  openDetail(request: any): void {
    this.selectedRequest = request;
    this.detailConfirmMode = 'view';
    this.rejectReasonInModal = '';
    this.managerCommentsInModal = '';
    this.showDetailModal = true;
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.selectedRequest = null;
    this.detailConfirmMode = 'view';
    this.rejectReasonInModal = '';
    this.managerCommentsInModal = '';
  }

  confirmApprove(): void {
    if (!this.selectedRequest?._id) return;

    this.confirmationModal.confirm({
      title: 'Approve Leave Request',
      message: 'Are you sure you want to approve this leave request?',
      confirmText: 'Approve',
      type: 'success'
    }).then(confirmed => {
      if (!confirmed) return;

      this.leaveService.updateLeaveStatus(this.selectedRequest._id, 'Approved').subscribe({
        next: () => {
          this.closeDetail();
          this.loadRequests();
          this.confirmationModal.alert('Success', 'Leave request approved successfully!', 'success');
        },
        error: (err) => this.confirmationModal.alert('Error', err?.error?.message || 'Failed to approve leave', 'error')
      });
    });
  }

  confirmReject(): void {
    if (!this.selectedRequest?._id || !this.rejectReasonInModal?.trim()) return;

    this.confirmationModal.confirm({
      title: 'Reject Leave Request',
      message: 'Are you sure you want to reject this request? This action cannot be undone.',
      confirmText: 'Reject',
      type: 'error'
    }).then(confirmed => {
      if (!confirmed) return;

      this.leaveService.updateLeaveStatus(this.selectedRequest._id, 'Rejected', this.rejectReasonInModal.trim()).subscribe({
        next: () => {
          this.closeDetail();
          this.loadRequests();
          this.confirmationModal.alert('Success', 'Leave request rejected.', 'success');
        },
        error: (err) => this.confirmationModal.alert('Error', err?.error?.message || 'Failed to reject leave', 'error')
      });
    });
  }

  confirmRequestChanges(): void {
    if (!this.selectedRequest?._id || !this.managerCommentsInModal?.trim()) return;

    this.confirmationModal.confirm({
      title: 'Request Changes',
      message: 'Are you sure you want to request changes for this leave request?',
      confirmText: 'Request Changes',
      type: 'warning'
    }).then(confirmed => {
      if (!confirmed) return;

      this.leaveService.updateLeaveStatus(this.selectedRequest._id, 'Changes Requested', undefined, this.managerCommentsInModal.trim()).subscribe({
        next: () => {
          this.closeDetail();
          this.loadRequests();
          this.confirmationModal.alert('Success', 'Change request sent to employee.', 'success');
        },
        error: (err) => this.confirmationModal.alert('Error', err?.error?.message || 'Failed to request changes', 'error')
      });
    });
  }
}
