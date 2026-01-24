import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


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
  imports: [CommonModule],
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

  constructor(private router: Router, private authService: AuthService) { }

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
    console.log('Open Apply Leave Modal');
    // Logic to open modal would go here
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
