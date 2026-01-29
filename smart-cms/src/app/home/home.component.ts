import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LeavePolicyService, LeavePolicy } from '../services/leave-policy.service';


export interface Task {
  id: number;
  title: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: Date;
}

export interface LeaveBalance {
  type: string;
  total: number;
  used: number;

  available: number;
  minNotice?: number; // Added minNotice
}

export interface Notification {
  id: number | string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'General' | 'Leave' | 'Work';
  leaveId?: string;
}

export interface Attendance {
  status: 'Clocked In' | 'Clocked Out';
  checkInTime?: Date;
  checkOutTime?: Date;
  totalHours: string;
}

export interface Payslip {
  id: string;
  month: string;
  year: number;
  netPay: number;
  downloadUrl: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // User Profile
  userProfile: any = null;
  currentDate: Date = new Date();

  // Mock Data
  attendance: Attendance = {
    status: 'Clocked Out',
    totalHours: '00:00'
  };

  leaveBalances: LeaveBalance[] = [
    { type: 'Casual Leave', total: 12, used: 2, available: 10 },
    { type: 'Sick Leave', total: 10, used: 1, available: 9 },
    { type: 'Privilege Leave', total: 15, used: 0, available: 15 }
  ];

  tasks: Task[] = [
    { id: 1, title: 'Complete Q1 Report', status: 'In Progress', priority: 'High', dueDate: new Date() },
    { id: 2, title: 'Update Client Profile', status: 'To Do', priority: 'Medium', dueDate: new Date(new Date().setDate(new Date().getDate() + 2)) },
    { id: 3, title: 'Team Meeting Prep', status: 'Done', priority: 'Low', dueDate: new Date(new Date().setDate(new Date().getDate() - 1)) }
  ];

  recentPayslip: Payslip = {
    id: 'PAY-JAN-2025',
    month: 'January',
    year: 2025,
    netPay: 45000,
    downloadUrl: '#'
  };

  // Policy Modal

  showPolicyModal = false;
  isPolicyAcknowledged = false; // User must read policy first
  generalRules: string[] = [];
  policies: LeavePolicy[] = [];

  // Notifications
  showNotifications = false;
  notifications: Notification[] = [
    { id: 1, title: 'Leave Approved', message: 'Your casual leave for tomorrow has been approved.', date: new Date(), read: false, type: 'success', category: 'Leave' },
    { id: 2, title: 'Team Meeting', message: 'All hands meeting at 3 PM via Zoom.', date: new Date(), read: true, type: 'info', category: 'Work' },
    { id: 3, title: 'System Maintenance', message: 'Server down for maintenance at midnight.', date: new Date(), read: false, type: 'warning', category: 'General' }
  ];

  // Leave Application Modal
  showLeaveModal = false;
  leaveForm = {
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  };
  minDate: string = new Date().toISOString().split('T')[0];
  isSubmittingLeave = false;

  myLeaves: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private leavePolicyService: LeavePolicyService
  ) { }

  ngOnInit(): void {
    // Get user from AuthService
    this.userProfile = this.authService.getUser();

    // Fallback if no user is logged in (for development/testing specific flows)
    if (!this.userProfile) {
      this.userProfile = {
        firstName: 'Guest',
        lastName: 'User',
        designation: 'Software Engineer',
        department: 'Engineering'
      };
    }
    this.loadLeaveData();
    if (this.userProfile) {
      this.loadMyLeavesAndSync();
    }
  }

  loadLeaveData(): void {
    this.leavePolicyService.getSettings().subscribe({
      next: (settings) => {
        if (settings && settings.generalLeaveRules) {
          this.generalRules = settings.generalLeaveRules;
        }
      },
      error: (err) => console.error('Error loading rules', err)
    });

    this.leavePolicyService.getPolicies().subscribe({
      next: (data) => {
        this.policies = data;
        const baseBalances = (data || [])
          .filter((p: any) => p.isActive && (p.allowedRoles || []).includes(this.userProfile?.role?.toLowerCase() || 'employee'))
          .map((p: any) => ({
            type: p.leaveName,
            total: p.annualLimit,
            used: 0,
            available: p.annualLimit,
            minNotice: p.minNoticeHours || 0
          }));
        this.leaveBalances = baseBalances;
        this.loadMyLeavesAndSync();
      },
      error: (err) => console.error('Error loading policies', err)
    });
  }

  private loadMyLeavesAndSync(): void {
    const userId = this.userProfile?._id || this.userProfile?.employeeId || this.userProfile?.id;
    if (!userId) return;
    this.leavePolicyService.getMyLeaves(userId).subscribe({
      next: (leaves) => {
        this.myLeaves = leaves || [];
        const usedByType: Record<string, number> = {};
        const leaveNotificationIds = new Set((this.notifications || []).filter((n: any) => n.leaveId).map((n: any) => n.leaveId));
        const newNotifications: Notification[] = [];

        (this.myLeaves || []).forEach((l: any) => {
          if (l.status === 'Approved') {
            const days = this.getLeaveDays(l.startDate, l.endDate);
            usedByType[l.leaveType] = (usedByType[l.leaveType] || 0) + days;
          }
          if ((l.status === 'Approved' || l.status === 'Rejected') && l._id && !leaveNotificationIds.has(l._id)) {
            const start = typeof l.startDate === 'string' ? new Date(l.startDate) : l.startDate;
            const end = typeof l.endDate === 'string' ? new Date(l.endDate) : l.endDate;
            const dateRange = `${(start as Date).toLocaleDateString()} – ${(end as Date).toLocaleDateString()}`;
            if (l.status === 'Approved') {
              newNotifications.push({
                id: `leave-${l._id}`,
                title: 'Leave Approved',
                message: `Your ${l.leaveType} (${dateRange}) has been approved.`,
                date: l.updatedAt ? new Date(l.updatedAt) : new Date(),
                read: false,
                type: 'success',
                category: 'Leave',
                leaveId: l._id
              } as any);
            } else {
              newNotifications.push({
                id: `leave-${l._id}`,
                title: 'Leave Rejected',
                message: l.rejectionReason ? `Your ${l.leaveType} (${dateRange}) was rejected. Reason: ${l.rejectionReason}` : `Your ${l.leaveType} (${dateRange}) was rejected.`,
                date: l.updatedAt ? new Date(l.updatedAt) : new Date(),
                read: false,
                type: 'error',
                category: 'Leave',
                leaveId: l._id
              } as any);
            }
            leaveNotificationIds.add(l._id);
          }
        });

        this.leaveBalances = this.leaveBalances.map(b => ({
          ...b,
          used: usedByType[b.type] || 0,
          available: Math.max(0, b.total - (usedByType[b.type] || 0))
        }));

        const existingNonLeave = this.notifications.filter((n: any) => !n.leaveId);
        this.notifications = [...newNotifications, ...existingNonLeave];
      },
      error: (err) => console.error('Error loading my leaves', err)
    });
  }

  getLeaveDays(start: string | Date, end: string | Date): number {
    const s = typeof start === 'string' ? new Date(start) : start;
    const e = typeof end === 'string' ? new Date(end) : end;
    const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.floor(diff) + 1);
  }

  // Modal Methods
  openPolicyModal(): void {
    this.showPolicyModal = true;
  }

  closePolicyModal(): void {
    this.showPolicyModal = false;
  }

  acknowledgePolicy(): void {
    this.isPolicyAcknowledged = true;
    this.closePolicyModal();
    this.leaveForm = {
      leaveType: this.leaveBalances.length > 0 ? this.leaveBalances[0].type : '',
      startDate: '',
      endDate: '',
      reason: ''
    };
    this.showLeaveModal = true;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  // Notification Tabs
  activeNotificationTab: string = 'All';
  notificationTabs: string[] = ['All', 'Unread', 'Leave', 'Work', 'General'];

  setActiveNotificationTab(tab: string): void {
    this.activeNotificationTab = tab;
  }

  getFilteredNotifications(): Notification[] {
    if (this.activeNotificationTab === 'All') {
      return this.notifications;
    } else if (this.activeNotificationTab === 'Unread') {
      return this.notifications.filter(n => !n.read);
    } else {
      return this.notifications.filter(n => n.category === this.activeNotificationTab);
    }
  }

  hasNotificationsByCategory(category: string): boolean {
    return this.notifications.some(n => n.category === category);
  }

  hasUnreadNotifications(): boolean {
    return this.notifications.some(n => !n.read);
  }

  toggleAttendance(): void {
    if (this.attendance.status === 'Clocked Out') {
      this.attendance.status = 'Clocked In';
      this.attendance.checkInTime = new Date();
    } else {
      this.attendance.status = 'Clocked Out';
      this.attendance.checkOutTime = new Date();
      // Mock duration calculation
      this.attendance.totalHours = '08:00';
    }
  }

  updateTaskStatus(task: Task): void {
    if (task.status === 'To Do') task.status = 'In Progress';
    else if (task.status === 'In Progress') task.status = 'Done';
    else if (task.status === 'Done') task.status = 'To Do';
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'High': return '#EF4444'; // Red
      case 'Medium': return '#EE964B'; // Orange
      case 'Low': return '#10B981'; // Green
      default: return '#9CA3AF';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Done': return '#10B981'; // Green
      case 'In Progress': return '#3083DC'; // Blue
      case 'To Do': return '#6B7280'; // Gray
      default: return '#9CA3AF';
    }
  }

  onApplyLeave(): void {
    if (!this.isPolicyAcknowledged) {
      this.openPolicyModal();
      return;
    }
    this.showLeaveModal = true;
    // Reset form
    this.leaveForm = {
      leaveType: this.leaveBalances.length > 0 ? this.leaveBalances[0].type : '',
      startDate: '',
      endDate: '',
      reason: ''
    };
  }

  closeLeaveModal(): void {
    this.showLeaveModal = false;
  }

  submitLeaveApplication(): void {
    if (!this.leaveForm.leaveType || !this.leaveForm.startDate || !this.leaveForm.endDate || !this.leaveForm.reason) {
      alert('Please fill in all fields');
      return;
    }

    if (new Date(this.leaveForm.endDate) < new Date(this.leaveForm.startDate)) {
      alert('End date cannot be before start date');
      return;
    }

    this.isSubmittingLeave = true;
    const userId = this.userProfile._id || this.userProfile.employeeId || this.userProfile.id; // Try all possible ID fields

    if (!userId) {
      alert('User ID not found. Please re-login.');
      this.isSubmittingLeave = false;
      return;
    }

    const leaveData = {
      userId: userId,
      leaveType: this.leaveForm.leaveType,
      startDate: this.leaveForm.startDate,
      endDate: this.leaveForm.endDate,
      reason: this.leaveForm.reason
    };

    console.log('Submitting leave:', leaveData);

    this.leavePolicyService.applyForLeave(leaveData).subscribe({
      next: (res) => {
        this.isSubmittingLeave = false;
        this.closeLeaveModal();
        this.notifications.unshift({
          id: Date.now(),
          title: 'Leave Application Submitted',
          message: `Your request for ${leaveData.leaveType} is pending approval.`,
          date: new Date(),
          read: false,
          type: 'info',
          category: 'Leave'
        });
        this.loadMyLeavesAndSync();
      },
      error: (err) => {
        console.error('Error applying for leave', err);
        this.isSubmittingLeave = false;
        alert('Failed to submit leave application. Please try again.');
      }
    });

  }

  downloadPayslip(id: string): void {
    console.log('Downloading payslip:', id);
    // Logic to download generic PDF or nav to payslip view
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
