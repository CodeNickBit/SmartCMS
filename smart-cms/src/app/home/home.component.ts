import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LeavePolicyService, LeavePolicy } from '../services/leave-policy.service';
import { ConfirmationModalService } from '../shared/confirmation-modal.service';
import { OfficeLocationService } from '../services/office-location.service';
import { AttendanceService, AttendanceRecord } from '../services/attendance.service';
import { ProfileModalComponent } from '../dashboard/components/profile-modal/profile-modal.component';
import { TaskService } from '../services/task.service';

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
  location?: { lat: number; lng: number };
  address?: string;
  distance?: number;
  approvalStatus?: 'pending' | 'approved' | 'declined' | 'marked_late';
}

export interface Payslip {
  id: string;
  month: string;
  year: number;
  netPay: number;
  downloadUrl: string;
}

interface OfficeLocation {
  _id?: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileModalComponent, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  userProfile: any = null;
  currentDate: Date = new Date();

  attendance: Attendance = {
    status: 'Clocked Out',
    totalHours: '00:00'
  };

  isProcessingAttendance: boolean = false;
  attendanceMessage: string = '';
  attendanceError: string = '';

  officeLocations: OfficeLocation[] = [];

  leaveBalances: LeaveBalance[] = [
    { type: 'Casual Leave', total: 12, used: 2, available: 10 },
    { type: 'Sick Leave', total: 10, used: 1, available: 9 },
    { type: 'Privilege Leave', total: 15, used: 0, available: 15 }
  ];

  realTasks: any[] = [];
  taskSummary = { total: 0, inProgress: 0, done: 0, overdue: 0 };
  tasksLoading = false;

  tasks: Task[] = [];

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

  // Profile Modal
  showProfileModal = false;

  // Notifications
  showNotifications = false;
  notifications: Notification[] = []; // Initialized empty, populated by Leave logic

  // Leave Application Modal
  showLeaveModal = false;
  leaveForm = {
    leaveType: '',
    leaveUnit: 'full-day',
    halfDayPeriod: 'first-half',
    startDate: '',
    endDate: '',
    reason: ''
  };
  minDate: string = new Date().toISOString().split('T')[0];
  isSubmittingLeave = false;

  myLeaves: any[] = [];
  showAllLeaves: boolean = false;

  get displayedLeaves(): any[] {
    if (!this.myLeaves) return [];
    return this.showAllLeaves ? this.myLeaves : this.myLeaves.slice(0, 5);
  }

  managerOnLeave = false;
  managerProxyName: string | null = null;

  isDarkMode = true;

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (isPlatformBrowser(this.platformId)) {
      this.applyTheme();
    }
  }

  private applyTheme(): void {
    const body = document.body;
    const html = document.documentElement;
    if (this.isDarkMode) {
      body.classList.add('theme-dark', 'dark');
      html.classList.add('dark');
      body.classList.remove('theme-light');
      localStorage.setItem('theme', 'dark');
    } else {
      body.classList.add('theme-light');
      body.classList.remove('theme-dark', 'dark');
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public router: Router,
    private authService: AuthService,
    private leavePolicyService: LeavePolicyService,
    private confirmationModal: ConfirmationModalService,
    private officeLocationService: OfficeLocationService,
    private attendanceService: AttendanceService,
    private taskService: TaskService
  ) { }

  ngOnInit(): void {
    this.userProfile = this.authService.getUser();

    // Check saved theme
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      this.isDarkMode = savedTheme !== 'light'; // Default to dark if not set
      this.applyTheme();
    }

    // Fallback if no user is logged in
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
      this.checkManagerStatus();
    }
    this.loadAttendanceData();
    this.loadRealTasks();
  }
  // ngOnDestroy removed as polling is removed

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

  checkManagerStatus(): void {
    const managerId = this.userProfile?.reportingManager;
    if (managerId) {
      this.leavePolicyService.getManagerStatus(managerId).subscribe({
        next: (res: any) => {
          this.managerOnLeave = res.onLeave;
          this.managerProxyName = res.proxyName;
        },
        error: (err) => console.error('Error fetching manager status', err)
      });
    }
  }

  getLeaveDays(start: string | Date, end: string | Date): number {
    const s = typeof start === 'string' ? new Date(start) : start;
    const e = typeof end === 'string' ? new Date(end) : end;
    const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.floor(diff) + 1);
  }

  isLeaveEditable(leave: any): boolean {
    if (!leave || !leave.startDate) return false;
    const start = typeof leave.startDate === 'string' ? new Date(leave.startDate) : leave.startDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Only allow editing if the start date is in the future or today
    return start >= today;
  }

  // Modal Methods
  openProfileModal(): void {
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }

  openPolicyModal(): void {
    this.showPolicyModal = true;
  }

  closePolicyModal(): void {
    this.showPolicyModal = false;
  }

  acknowledgePolicy(): void {
    this.isPolicyAcknowledged = true;
    this.closePolicyModal();
    // Do NOT open leave form automatically. User must click "Apply" explicitly.
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

  get unreadNotificationCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  loadAttendanceData(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadOfficeLocations();
      this.loadTodayAttendance();
    }
  }

  loadTodayAttendance() {
    this.attendanceService.getTodayAttendance().subscribe({
      next: (record) => {
        if (record) {
          this.attendance = {
            status: record.checkOut ? 'Clocked Out' : (record.checkIn ? 'Clocked In' : 'Clocked Out'),
            checkInTime: record.checkIn ? new Date(record.checkIn.time) : undefined,
            checkOutTime: record.checkOut ? new Date(record.checkOut.time) : undefined,
            totalHours: record.workingHours ? this.formatWorkingHours(record.workingHours) : '00:00',
            location: record.checkIn ? { lat: record.checkIn.location.latitude, lng: record.checkIn.location.longitude } : undefined,
            address: record.checkIn ? record.checkIn.address : undefined,
            distance: record.checkIn ? record.checkIn.distance : undefined,
            approvalStatus: record.approvalStatus
          };
        }
      },
      error: (error) => {
        console.error('Error loading today attendance:', error);
      }
    });
  }

  formatWorkingHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  loadOfficeLocations() {
    this.officeLocationService.getActive().subscribe({
      next: (locations) => {
        this.officeLocations = locations.map(loc => ({
          _id: loc._id,
          name: loc.name,
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
          radius: Number(loc.radius)
        }));
      },
      error: (error: any) => {
        console.error('Error loading office locations:', error);

        // LOG DEBUG INFO FROM BACKEND
        if (error.error?.debug) {
          console.error('🔍 BACKEND DEBUG INFO:');
          console.error('  Token Role:', error.error.debug.tokenRole);
          console.error('  Token ID:', error.error.debug.tokenId);
          console.error('  Queried Collection:', error.error.debug.queriedCollection);
          console.error('  ⚠️ This user ID was NOT FOUND in the database!');
        }

        // FAIL-SAFE: Use hardcoded locations if API fails to prevent white screen/logout loop
        // This is temporary for debugging until backend auth is fixed
        this.attendanceError = 'Using offline mode for locations due to connection error.';
        this.officeLocations = [
          { name: 'Head Office', latitude: 22.991104, longitude: 72.487986, radius: 100 }, // Updated to Gujarat coordinates
          { name: 'Branch Office', latitude: 23.0225, longitude: 72.5714, radius: 150 }
        ];

        if (error.status === 401) {
          console.warn('Authentication failed for locations, but staying on page for debugging.');
          // this.authService.logout();
          // this.router.navigate(['/login']);
        }
      }
    });
  }

  toggleAttendance(): void {
    if (this.attendance.status === 'Clocked Out') {
      this.checkIn();
    } else {
      this.checkOut();
    }
  }

  checkIn(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isProcessingAttendance = true;
    this.attendanceError = '';
    this.attendanceMessage = '';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.validateLocationAndCheckIn(lat, lng);
        },
        (error) => {
          this.isProcessingAttendance = false;
          this.handleLocationError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      this.isProcessingAttendance = false;
      this.attendanceError = 'Geolocation is not supported by your browser';
    }
  }

  validateLocationAndCheckIn(lat: number, lng: number): void {
    if (!this.officeLocations || this.officeLocations.length === 0) {
      this.isProcessingAttendance = false;
      this.attendanceError = 'No office locations found. Please try again later or contact admin.';
      return;
    }

    const result = this.findNearestOffice(lat, lng);

    if (result.isWithinGeofence) {
      this.getAddressAndCompleteCheckIn(lat, lng, result.distance, result.office.name);
    } else {
      this.isProcessingAttendance = false;
      // Detailed error message with coordinates
      this.attendanceError = `You are ${Math.round(result.distance)}m away from ${result.office.name}. 
      (User: ${lat.toFixed(6)}, ${lng.toFixed(6)})
      (Office: ${result.office.latitude.toFixed(6)}, ${result.office.longitude.toFixed(6)})`;
    }
  }

  findNearestOffice(lat: number, lng: number): { office: OfficeLocation; distance: number; isWithinGeofence: boolean } {
    let nearest = this.officeLocations[0];
    let minDistance = this.calculateDistance(lat, lng, nearest.latitude, nearest.longitude);

    for (const office of this.officeLocations) {
      const distance = this.calculateDistance(lat, lng, office.latitude, office.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = office;
      }
    }

    return {
      office: nearest,
      distance: minDistance,
      isWithinGeofence: minDistance <= nearest.radius
    };
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  getAddressAndCompleteCheckIn(lat: number, lng: number, distance: number, officeName: string): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    fetch(url, {
      headers: {
        'User-Agent': 'SmartCMS/1.0'
      }
    })
      .then(response => response.json())
      .then(data => {
        const address = this.formatAddress(data.address);
        this.completeCheckIn(lat, lng, address, distance, officeName);
      })
      .catch(error => {
        console.error('Error fetching address:', error);
        this.completeCheckIn(lat, lng, 'Address not available', distance, officeName);
      });
  }

  formatAddress(addressData: any): string {
    const parts = [];
    if (addressData.road) parts.push(addressData.road);
    if (addressData.suburb) parts.push(addressData.suburb);
    if (addressData.city) parts.push(addressData.city);
    return parts.join(', ') || 'Address not found';
  }

  completeCheckIn(lat: number, lng: number, address: string, distance: number, officeName: string): void {
    const result = this.findNearestOffice(lat, lng);
    const officeLocationId = result.office._id || '';

    this.attendanceService.checkIn({
      latitude: lat,
      longitude: lng,
      address,
      distance,
      officeLocationId
    }).subscribe({
      next: (response) => {
        this.attendance = {
          status: 'Clocked In',
          checkInTime: new Date(),
          totalHours: '00:00',
          location: { lat, lng },
          address,
          distance,
          approvalStatus: 'pending'
        };

        this.isProcessingAttendance = false;
        
        if (response.escalation) {
          this.attendanceMessage = `Checked in successfully at ${officeName}! Your reporting manager is unavailable. Request assigned to ${response.escalation.managerName} (${response.escalation.managerDepartment}) - ${response.escalation.managerEmail}`;
        } else {
          this.attendanceMessage = `Checked in successfully at ${officeName}! Status: Pending Approval`;
        }
        
        setTimeout(() => this.attendanceMessage = '', 8000);
      },
      error: (error) => {
        this.isProcessingAttendance = false;
        this.attendanceError = error.error?.message || 'Failed to check in';
        setTimeout(() => this.attendanceError = '', 5000);
      }
    });
  }

  checkOut(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isProcessingAttendance = true;
    this.attendanceError = '';
    this.attendanceMessage = '';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.completeCheckOut(lat, lng);
        },
        (error) => {
          this.isProcessingAttendance = false;
          // Even if location fails, try to check out with 0,0 or previous location
          this.completeCheckOut(0, 0);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      this.isProcessingAttendance = false;
      this.completeCheckOut(0, 0);
    }
  }

  completeCheckOut(lat: number, lng: number): void {
    this.attendanceService.checkOut({
      latitude: lat,
      longitude: lng,
      address: this.attendance.address || 'Unknown'
    }).subscribe({
      next: (response) => {
        if (this.attendance.checkInTime) {
          this.attendance.status = 'Clocked Out';
          this.attendance.checkOutTime = new Date();

          const checkInTime = this.attendance.checkInTime.getTime();
          const checkOutTime = this.attendance.checkOutTime.getTime();
          const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);

          this.attendance.totalHours = this.formatWorkingHours(hoursWorked);
          this.isProcessingAttendance = false;
          this.attendanceMessage = `Checked out successfully! Total: ${this.attendance.totalHours}`;
          setTimeout(() => this.attendanceMessage = '', 5000);

          // Refresh to get final status/hours from backend
          this.loadTodayAttendance();
        }
      },
      error: (error) => {
        this.isProcessingAttendance = false;
        this.attendanceError = error.error?.message || 'Failed to check out';
        setTimeout(() => this.attendanceError = '', 5000);
      }
    });
  }

  handleLocationError(error: GeolocationPositionError): void {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.attendanceError = 'Location permission denied. Please enable location access.';
        break;
      case error.POSITION_UNAVAILABLE:
        this.attendanceError = 'Location information unavailable.';
        break;
      case error.TIMEOUT:
        this.attendanceError = 'Location request timed out.';
        break;
      default:
        this.attendanceError = 'An error occurred while getting your location.';
    }
    setTimeout(() => this.attendanceError = '', 5000);
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

  // Edit State
  isEditMode = false;
  editingLeaveId: string | null = null;
  activeManagerComments: string | null = null;

  // File Upload
  selectedFiles: File[] = [];

  onFileSelected(event: any): void {
    if (event.target.files) {
      this.selectedFiles = Array.from(event.target.files);
    }
  }

  onApplyLeave(): void {
    if (!this.isPolicyAcknowledged) {
      this.openPolicyModal();
      return;
    }
    this.isEditMode = false;
    this.editingLeaveId = null;
    this.activeManagerComments = null;
    this.showLeaveModal = true;
    this.selectedFiles = []; // Reset files
    // Reset form
    this.leaveForm = {
      leaveType: this.leaveBalances.length > 0 ? this.leaveBalances[0].type : '',
      leaveUnit: 'full-day',
      halfDayPeriod: 'first-half',
      startDate: '',
      endDate: '',
      reason: ''
    };
  }

  // ... (onEditLeave handles files? Optional for now – usually can't re-upload easily in edit without complex UI)
  // For simplicity, we won't support editing files in this pass, only new uploads on creation.

  onEditLeave(leave: any): void {
    this.isEditMode = true;
    this.editingLeaveId = leave._id;
    this.activeManagerComments = leave.managerComments;
    this.showLeaveModal = true;

    // Safety check for dates
    const s = leave.startDate instanceof Date ? leave.startDate : new Date(leave.startDate);
    const e = leave.endDate instanceof Date ? new Date(leave.endDate) : new Date(leave.endDate);

    this.leaveForm = {
      leaveType: leave.leaveType,
      leaveUnit: leave.leaveUnit || 'full-day',
      halfDayPeriod: leave.halfDayPeriod || 'first-half',
      startDate: s.toISOString().split('T')[0],
      endDate: e.toISOString().split('T')[0],
      reason: leave.reason
    };
  }

  closeLeaveModal(): void {
    this.showLeaveModal = false;
    this.isEditMode = false;
    this.editingLeaveId = null;
    this.activeManagerComments = null;
  }

  submitLeaveApplication(): void {
    // Auto-set End Date if half-day
    if (this.leaveForm.leaveUnit === 'half-day') {
      this.leaveForm.endDate = this.leaveForm.startDate;
    }

    if (!this.leaveForm.leaveType || !this.leaveForm.startDate || !this.leaveForm.endDate || !this.leaveForm.reason) {
      this.confirmationModal.alert('Validation Error', 'Please fill in all fields', 'warning');
      return;
    }

    if (new Date(this.leaveForm.endDate) < new Date(this.leaveForm.startDate)) {
      this.confirmationModal.alert('Validation Error', 'End date cannot be before start date', 'warning');
      return;
    }

    this.isSubmittingLeave = true;
    const userId = this.userProfile._id || this.userProfile.employeeId || this.userProfile.id;

    if (!userId) {
      this.confirmationModal.alert('Error', 'User ID not found. Please re-login.', 'error');
      this.isSubmittingLeave = false;
      return;
    }

    // Use FormData for File Upload capability
    if (this.isEditMode && this.editingLeaveId) {
      // Update Logic (JSON for now as we didn't add file update support yet)
      const leaveData = {
        userId: userId,
        leaveType: this.leaveForm.leaveType,
        leaveUnit: this.leaveForm.leaveUnit,
        halfDayPeriod: this.leaveForm.leaveUnit === 'half-day' ? this.leaveForm.halfDayPeriod : undefined,
        startDate: this.leaveForm.startDate,
        endDate: this.leaveForm.endDate,
        reason: this.leaveForm.reason
      };

      this.leavePolicyService.updateLeaveRequest(this.editingLeaveId, leaveData).subscribe({
        next: (res) => {
          console.log('Leave updated successfully', res);
          this.loadMyLeavesAndSync();
          this.closeLeaveModal();
          this.isSubmittingLeave = false;
          this.confirmationModal.alert('Success', 'Leave request updated successfully!', 'success');
        },
        error: (err) => {
          console.error('Error updating leave', err);
          this.isSubmittingLeave = false;
          this.confirmationModal.alert('Error', err.error?.message || 'Failed to update leave request', 'error');
        }
      });

    } else {
      // Create Logic (FormData)
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('leaveType', this.leaveForm.leaveType);
      formData.append('leaveUnit', this.leaveForm.leaveUnit);
      if (this.leaveForm.leaveUnit === 'half-day') {
        formData.append('halfDayPeriod', this.leaveForm.halfDayPeriod);
      }
      formData.append('startDate', this.leaveForm.startDate);
      formData.append('endDate', this.leaveForm.endDate);
      formData.append('reason', this.leaveForm.reason);

      // Append files
      this.selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });

      this.leavePolicyService.applyForLeave(formData).subscribe({
        next: (res: any) => {
          console.log('Leave requested successfully', res);
          
          let msg = 'Leave request submitted successfully!';
          if (res.escalated) {
             msg = this.managerProxyName 
                 ? `Leave submitted! It has been automatically routed to your Proxy Manager (${this.managerProxyName}) for approval.`
                 : 'Leave submitted! Since your manager is away, it has been automatically routed to HR for approval.';
          }
          
          this.confirmationModal.alert('Success', msg, 'success');
          this.closeLeaveModal();
          this.loadMyLeavesAndSync();
          this.isSubmittingLeave = false;
        },
        error: (err) => {
          console.error('Error applying for leave', err);
          this.isSubmittingLeave = false;
          const msg = err.error?.message || 'Failed to submit leave application';
          this.confirmationModal.alert('Error', msg, 'error');
        }
      });
    }
  }

  // Helper method to determine if file attachment is required/recommended
  requiresAttachment(): boolean {
    const leaveType = this.leaveForm.leaveType.toLowerCase();
    return leaveType.includes('sick') || leaveType.includes('medical');
  }

  onCancelLeave(leaveId: string): void {
    this.confirmationModal.confirm({
      title: 'Cancel Leave Request',
      message: 'Are you sure you want to cancel this leave request?',
      confirmText: 'Yes, Cancel',
      cancelText: 'No',
      type: 'warning'
    }).then(confirmed => {
      if (!confirmed) return;
      this.leavePolicyService.cancelLeave(leaveId).subscribe({
        next: () => {
          this.confirmationModal.alert('Success', 'Leave request cancelled successfully.', 'success');
          this.loadMyLeavesAndSync();
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to cancel leave request';
          this.confirmationModal.alert('Error', msg, 'error');
        }
      });
    });
  }

  downloadPayslip(id: string): void {
    console.log('Downloading payslip:', id);
    // Logic to download generic PDF or nav to payslip view
  }

  loadRealTasks(): void {
    this.tasksLoading = true;
    this.taskService.getMyTasks().subscribe({
      next: (data: any[]) => {
        this.realTasks = (data || []).slice(0, 5);
        const now = new Date();
        let inProgress = 0, done = 0, overdue = 0;
        (data || []).forEach((t: any) => {
          if (t.status === 'in_progress') inProgress++;
          if (t.status === 'done') done++;
          if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'done') overdue++;
        });
        this.taskSummary = { total: data?.length || 0, inProgress, done, overdue };
        this.tasksLoading = false;
      },
      error: () => { this.tasksLoading = false; }
    });
  }

  formatTaskStatus(s: string): string { return s?.replace(/_/g, ' ') || ''; }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

