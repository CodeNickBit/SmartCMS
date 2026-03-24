import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LeavePolicyService, LeaveRequest, LeavePolicy } from '../../services/leave-policy.service';
import { ManagerService, Manager } from '../../services/manager.service';
import { SharedSidebarComponent } from '../components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../components/header/header.component';
import { ConfirmationModalService } from '../../shared/confirmation-modal.service';

@Component({
  selector: 'app-my-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedSidebarComponent, SharedHeaderComponent],
  templateUrl: './my-leaves.component.html'
})
export class MyLeavesComponent implements OnInit {
  myLeaves: LeaveRequest[] = [];
  leaveBalances: any[] = [];
  currentUser: any;
  showApplyModal = false;

  leaveForm = {
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    leaveUnit: 'full-day',
    halfDayPeriod: 'first-half',
    proxyManagerId: ''
  };

  activeManagers: Manager[] = [];

  pendingLeaveNotificationsCount = 0;

  constructor(
    private leaveService: LeavePolicyService,
    private authService: AuthService,
    private managerService: ManagerService,
    private confirmationModal: ConfirmationModalService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getUser();
    if (this.currentUser) {
      this.loadLeaves();
      this.loadPolicies();
      this.loadPendingLeavesCount();
      this.loadManagers();
    }
  }

  loadPendingLeavesCount() {
    const userId = this.currentUser._id ?? this.currentUser.id;
    if (this.currentUser.role === 'manager' || this.currentUser.role === 'hr') {
      this.leaveService.getManagerLeaves(userId).subscribe({
        next: (data) => {
          this.pendingLeaveNotificationsCount = (data || []).filter((l: any) => l.status === 'Pending').length;
        }
      });
    }
  }

  loadLeaves() {
    const userId = this.currentUser._id ?? this.currentUser.id;
    this.leaveService.getMyLeaves(userId).subscribe({
      next: (data) => this.myLeaves = data || [],
      error: (err) => console.error('Error loading leaves', err)
    });
  }

  loadManagers() {
    this.managerService.getActiveManagers().subscribe({
      next: (data) => {
        const userId = this.currentUser._id ?? this.currentUser.id;
        this.activeManagers = data.filter(m => m._id !== userId);
      },
      error: (err) => console.error('Error loading managers', err)
    });
  }

  loadPolicies() {
    this.leaveService.getPolicies().subscribe({
      next: (policies: LeavePolicy[]) => {
        const role = this.currentUser.role || 'manager';
        this.leaveBalances = policies
          .filter(p => p.isActive && p.allowedRoles.includes(role))
          .map(p => ({
            type: p.leaveName,
            total: p.annualLimit,
            used: 0
          }));
        
        // Calculate used leaves from myLeaves
        if (this.myLeaves.length > 0) {
           const currentYear = new Date().getFullYear();
           this.leaveBalances.forEach(balance => {
             const usedLeaves = this.myLeaves.filter(l => 
                l.leaveType === balance.type && 
                l.status === 'Approved' && 
                new Date(l.startDate).getFullYear() === currentYear
             );
             let daysUsed = 0;
             usedLeaves.forEach(l => {
                if (l.leaveType === 'half-day') {
                   daysUsed += 0.5;
                } else {
                   const start = new Date(l.startDate);
                   const end = new Date(l.endDate);
                   const diffTime = Math.abs(end.getTime() - start.getTime());
                   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                   daysUsed += diffDays;
                }
             });
             balance.used = daysUsed;
           });
        }

        if (this.leaveBalances.length > 0) {
          this.leaveForm.leaveType = this.leaveBalances[0].type;
        }
      }
    });
  }

  openApplyModal() {
    this.leaveForm = {
        leaveType: this.leaveBalances.length > 0 ? this.leaveBalances[0].type : '',
        startDate: '',
        endDate: '',
        reason: '',
        leaveUnit: 'full-day',
        halfDayPeriod: 'first-half',
        proxyManagerId: ''
    };
    this.showApplyModal = true;
  }
  
  closeApplyModal() {
    this.showApplyModal = false;
  }

  submitLeave() {
    if (this.leaveForm.leaveUnit === 'half-day') {
       this.leaveForm.endDate = this.leaveForm.startDate;
    }

    if (!this.leaveForm.leaveType || !this.leaveForm.startDate || !this.leaveForm.endDate || !this.leaveForm.reason) {
      this.confirmationModal.alert('Error', 'Please fill all required fields.', 'error');
      return;
    }

    const start = new Date(this.leaveForm.startDate);
    const end = new Date(this.leaveForm.endDate);
    if (end < start) {
      this.confirmationModal.alert('Error', 'End date cannot be before start date.', 'error');
      return;
    }

    const payload = {
      userId: this.currentUser._id ?? this.currentUser.id,
      ...this.leaveForm
    };
    
    // Clean up empty string or half-day selection
    if (!payload.proxyManagerId || this.leaveForm.leaveUnit === 'half-day') {
       delete (payload as any).proxyManagerId;
    }

    this.leaveService.applyForLeave(payload).subscribe({
      next: (res) => {
        this.confirmationModal.alert('Success', 'Leave request submitted successfully!', 'success');
        this.closeApplyModal();
        this.loadLeaves();
      },
      error: (err) => {
        this.confirmationModal.alert('Error', err?.error?.message || 'Failed to apply for leave.', 'error');
      }
    });
  }

  cancelLeave(id: string | undefined) {
    if (!id) return;
    this.confirmationModal.confirm({
      title: 'Cancel Leave',
      message: 'Are you sure you want to cancel this leave request?',
      confirmText: 'Yes, Cancel',
      type: 'warning'
    }).then(confirmed => {
      if (confirmed) {
        this.leaveService.cancelLeave(id).subscribe({
          next: () => {
            this.confirmationModal.alert('Success', 'Leave cancelled successfully', 'success');
            this.loadLeaves();
          },
          error: (err) => this.confirmationModal.alert('Error', err?.error?.message || 'Failed to cancel leave', 'error')
        });
      }
    });
  }
}
