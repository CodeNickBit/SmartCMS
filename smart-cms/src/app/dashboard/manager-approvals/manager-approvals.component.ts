import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedSidebarComponent } from '../components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../components/header/header.component';
import { AttendanceService, AttendanceRecord } from '../../services/attendance.service';

@Component({
    selector: 'app-manager-approvals',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SharedSidebarComponent,
        SharedHeaderComponent
    ],
    templateUrl: './manager-approvals.component.html',
    styleUrl: './manager-approvals.component.css'
})
export class ManagerApprovalsComponent implements OnInit {
    pendingRequests: AttendanceRecord[] = [];
    filteredRequests: AttendanceRecord[] = [];
    isLoading: boolean = true;
    totalPending: number = 0;

    // Filter & Search
    searchQuery: string = '';
    filterStatus: string = 'all'; // all, pending, approved, declined, marked_late
    filterDate: string = '';

    // Modal for action
    showActionModal: boolean = false;
    selectedAttendance: AttendanceRecord | null = null;
    actionType: 'approve' | 'decline' | 'late' | null = null;
    managerNotes: string = '';

    // Success/Error messages
    successMessage: string = '';
    errorMessage: string = '';

    // Processing state
    isProcessing: boolean = false;

    constructor(private attendanceService: AttendanceService) { }

    ngOnInit() {
        this.loadPendingRequests();
    }

    loadPendingRequests() {
        this.isLoading = true;
        this.attendanceService.getPendingApprovals(100, 0).subscribe({
            next: (response) => {
                this.pendingRequests = response.attendance;
                this.filteredRequests = [...this.pendingRequests];
                this.totalPending = response.total;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading pending requests:', error);
                this.errorMessage = 'Failed to load pending requests';
                this.isLoading = false;
            }
        });
    }

    applyFilters() {
        let filtered = [...this.pendingRequests];

        // Search filter
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(record => {
                const employee = record.employeeId;
                const name = `${employee?.firstName || ''} ${employee?.lastName || ''}`.toLowerCase();
                const empId = employee?.employeeId?.toLowerCase() || '';
                const dept = employee?.department?.toLowerCase() || '';
                return name.includes(query) || empId.includes(query) || dept.includes(query);
            });
        }

        // Status filter
        if (this.filterStatus !== 'all') {
            filtered = filtered.filter(record => record.approvalStatus === this.filterStatus);
        }

        // Date filter
        if (this.filterDate) {
            const filterDateObj = new Date(this.filterDate);
            filterDateObj.setHours(0, 0, 0, 0);
            filtered = filtered.filter(record => {
                const recordDate = new Date(record.date);
                recordDate.setHours(0, 0, 0, 0);
                return recordDate.getTime() === filterDateObj.getTime();
            });
        }

        this.filteredRequests = filtered;
    }

    openActionModal(attendance: AttendanceRecord, action: 'approve' | 'decline' | 'late') {
        this.selectedAttendance = attendance;
        this.actionType = action;
        this.managerNotes = '';
        this.showActionModal = true;
    }

    closeActionModal() {
        this.showActionModal = false;
        this.selectedAttendance = null;
        this.actionType = null;
        this.managerNotes = '';
    }

    confirmAction() {
        if (!this.selectedAttendance || !this.actionType) return;

        this.isProcessing = true;
        const attendanceId = this.selectedAttendance._id!;

        let actionObservable;

        switch (this.actionType) {
            case 'approve':
                actionObservable = this.attendanceService.approveAttendance(attendanceId, this.managerNotes);
                break;
            case 'decline':
                actionObservable = this.attendanceService.declineAttendance(attendanceId, this.managerNotes);
                break;
            case 'late':
                actionObservable = this.attendanceService.markAsLate(attendanceId, this.managerNotes);
                break;
        }

        actionObservable.subscribe({
            next: (response) => {
                this.successMessage = response.message;
                this.isProcessing = false;
                this.closeActionModal();
                this.loadPendingRequests(); // Reload the list
                setTimeout(() => this.successMessage = '', 5000);
            },
            error: (error) => {
                this.errorMessage = error.error?.message || 'Action failed';
                this.isProcessing = false;
                setTimeout(() => this.errorMessage = '', 5000);
            }
        });
    }

    getEmployeeName(attendance: AttendanceRecord): string {
        const emp = attendance.employeeId;
        return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
    }

    getEmployeeId(attendance: AttendanceRecord): string {
        return attendance.employeeId?.employeeId || 'N/A';
    }

    getDepartment(attendance: AttendanceRecord): string {
        return attendance.employeeId?.department || 'N/A';
    }

    getDesignation(attendance: AttendanceRecord): string {
        return attendance.employeeId?.designation || 'N/A';
    }

    getMapLink(attendance: AttendanceRecord): string {
        if (!attendance.checkIn) return '#';
        const lat = attendance.checkIn.location.latitude;
        const lng = attendance.checkIn.location.longitude;
        return `https://www.google.com/maps?q=${lat},${lng}`;
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'pending': return 'bg-yellow-900/30 border-yellow-600/50 text-yellow-400';
            case 'approved': return 'bg-emerald-900/30 border-emerald-600/50 text-emerald-400';
            case 'declined': return 'bg-red-900/30 border-red-600/50 text-red-400';
            case 'marked_late': return 'bg-orange-900/30 border-orange-600/50 text-orange-400';
            default: return 'bg-slate-900/30 border-slate-300 dark:border-slate-600/50 text-slate-500 light:text-[#7A96B2] dark:text-slate-400';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'pending': return 'Pending';
            case 'approved': return 'Approved';
            case 'declined': return 'Declined';
            case 'marked_late': return 'Marked Late';
            default: return status;
        }
    }

    getActionModalTitle(): string {
        switch (this.actionType) {
            case 'approve': return 'Approve Attendance';
            case 'decline': return 'Decline Attendance';
            case 'late': return 'Mark as Late';
            default: return 'Action';
        }
    }

    getActionButtonClass(): string {
        switch (this.actionType) {
            case 'approve': return 'bg-emerald-600 hover:bg-emerald-700';
            case 'decline': return 'bg-red-600 hover:bg-red-700';
            case 'late': return 'bg-orange-600 hover:bg-orange-700';
            default: return 'bg-blue-600 hover:bg-blue-700';
        }
    }
}
