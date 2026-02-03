import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, AdminHeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentDate: Date = new Date();
  searchQuery: string = '';

  statsCards = [
    { title: 'Total Employees', value: '1,240', change: '+ 12%', icon: 'users', color: 'bg-[#3083DC]', iconBg: 'bg-blue-900', text: 'text-[#3083DC]' },
    { title: 'Departments', value: '12', change: '0%', icon: 'building', color: 'bg-[#EE964B]', iconBg: 'bg-orange-900', text: 'text-[#EE964B]' },
    { title: 'Pending Leave', value: '5', change: '+2 New', icon: 'calendar', color: 'bg-[#3083DC]', iconBg: 'bg-blue-900', text: 'text-[#3083DC]' }, // Reusing blue/orange as teal wasn't in palette
    { title: 'Active Projects', value: '8', change: 'Active', icon: 'rocket', color: 'bg-[#EE964B]', iconBg: 'bg-orange-900', text: 'text-[#EE964B]' }
  ];

  attendanceData = [
    { day: 'Mon', value: 65 },
    { day: 'Tue', value: 85 },
    { day: 'Wed', value: 60 },
    { day: 'Thu', value: 90 },
    { day: 'Fri', value: 75 },
    { day: 'Sat', value: 30 }
  ];

  departmentData = [
    { name: 'Engineering', value: 40, color: '#3083DC' },
    { name: 'Sales', value: 28, color: '#EE964B' },
    { name: 'Marketing', value: 16, color: '#E1F2FE' },
    { name: 'Others', value: 16, color: '#64748B' }
  ];

  recentActivities = [
    {
      name: 'Sarah Jenkins',
      avatar: 'assets/avatars/sarah.jpg',
      action: 'Submitted Q3 Report',
      date: 'Oct 24, 2023',
      status: 'Completed',
      statusColor: 'bg-green-100 text-green-700'
    },
    {
      name: 'Michael Chen',
      avatar: 'assets/avatars/michael.jpg',
      action: 'Requested Sick Leave',
      date: 'Oct 23, 2023',
      status: 'Pending',
      statusColor: 'bg-orange-100 text-orange-700'
    },
    {
      name: 'David Kim',
      avatar: 'assets/avatars/david.jpg',
      action: 'New Employee Onboarding',
      date: 'Oct 22, 2023',
      status: 'In Progress',
      statusColor: 'bg-blue-100 text-blue-700'
    }
  ];

  pendingApprovals = [
    {
      title: 'Expense Claim',
      subtitle: 'Software License - $450',
      meta: 'By: Jessica L.',
      icon: 'receipt'
    },
    {
      title: 'Leave Request',
      subtitle: 'Annual Leave - 3 Days',
      meta: 'By: Mark T.',
      icon: 'plane'
    }
  ];

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
  }

  getDepartmentGradient(): string {
    let gradient = 'conic-gradient(';
    let currentAngle = 0;

    this.departmentData.forEach((dept, index) => {
      const angle = (dept.value / 100) * 360;
      gradient += `${dept.color} ${currentAngle}deg ${currentAngle + angle}deg`;
      if (index < this.departmentData.length - 1) gradient += ', ';
      currentAngle += angle;
    });

    return gradient + ')';
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    }
  }
}
