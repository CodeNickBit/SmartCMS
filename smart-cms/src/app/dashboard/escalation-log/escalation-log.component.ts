import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedSidebarComponent } from '../components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../components/header/header.component';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-escalation-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedSidebarComponent,
    SharedHeaderComponent
  ],
  templateUrl: './escalation-log.component.html',
  styleUrl: './escalation-log.component.css'
})
export class EscalationLogComponent implements OnInit {
  escalations: any[] = [];
  isLoading: boolean = true;
  userRole: string = '';
  
  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getUser();
    this.userRole = user?.role || '';
    this.loadEscalations();
  }

  loadEscalations() {
    this.isLoading = true;
    this.attendanceService.getMyEscalations(50).subscribe({
      next: (data) => {
        this.escalations = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading escalations:', error);
        this.isLoading = false;
      }
    });
  }

  getEmployeeName(escalation: any): string {
    const emp = escalation.employeeId;
    if (!emp) return 'Unknown';
    return `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-orange-900/30 text-orange-300 border-orange-700';
      case 'resolved':
        return 'bg-emerald-900/30 text-emerald-300 border-emerald-700';
      case 'cancelled':
        return 'bg-slate-700/30 text-slate-300 border-slate-600';
      default:
        return 'bg-slate-700/30 text-slate-300 border-slate-600';
    }
  }

  getReasonLabel(reason: string): string {
    switch (reason) {
      case 'manager_on_leave':
        return 'Manager on Leave';
      case 'manager_absent':
        return 'Manager Absent';
      case 'backup_manager_absent':
        return 'Backup Manager Absent';
      case 'manual_escalation':
        return 'Manual Escalation';
      default:
        return reason;
    }
  }
}
