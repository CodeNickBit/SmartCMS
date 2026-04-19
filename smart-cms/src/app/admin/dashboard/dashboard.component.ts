import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';
import { AdminDashboardService, DashboardStats } from '../../services/admin-dashboard.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, AdminHeaderComponent, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentDate: Date = new Date();
  searchQuery: string = '';

  statsCards: any[] = [
    { title: 'Total Employees', value: '0', change: '+ 0%', icon: 'users', color: 'bg-[#3083DC]', iconBg: 'bg-blue-900', text: 'text-[#3083DC]' },
    { title: 'Departments', value: '0', change: '0%', icon: 'building', color: 'bg-[#EE964B]', iconBg: 'bg-orange-900', text: 'text-[#EE964B]' },
    { title: 'Pending Leave', value: '0', change: '+0 New', icon: 'calendar', color: 'bg-[#3083DC]', iconBg: 'bg-blue-900', text: 'text-[#3083DC]' },
    { title: 'Active Projects', value: '0', change: 'Active', icon: 'rocket', color: 'bg-[#EE964B]', iconBg: 'bg-orange-900', text: 'text-[#EE964B]' }
  ];

  pulseData: any[] = [];

  departmentData = [
    { name: 'Engineering', value: 40, color: '#3083DC' },
    { name: 'Sales', value: 28, color: '#EE964B' },
    { name: 'Marketing', value: 16, color: '#E1F2FE' },
    { name: 'Others', value: 16, color: '#64748B' }
  ];

  recentActivities: any[] = [];

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
    private adminService: AdminDashboardService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.fetchStats();
  }

  fetchStats() {
    this.adminService.getAdminStats().subscribe({
      next: (data: DashboardStats) => {
        // Handle animated counters
        const oldStats = JSON.parse(JSON.stringify(this.statsCards));
        this.statsCards = data.statsCards;
        this.pulseData = data.pulseData;
        this.departmentData = data.departmentData;
        this.recentActivities = data.recentActivities;
        this.pendingApprovals = data.pendingApprovals;
        
        // Trigger animations
        if (isPlatformBrowser(this.platformId)) {
          this.animateValues();
        }
      },
      error: (err: any) => console.error('Error fetching admin stats:', err)
    });
  }

  animateValues() {
    // Simple logic to trigger a CSS class or handled by template
    const elements = document.querySelectorAll('.animate-count');
    elements.forEach(el => {
      el.classList.remove('pulse-animation');
      void (el as HTMLElement).offsetWidth; // trigger reflow
      el.classList.add('pulse-animation');
    });
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

  getPulsePaths(): any[] {
    if (!this.pulseData || !this.pulseData.length) return [];

    const width = 800;
    const height = 150;
    const maxVal = Math.max(...this.pulseData.map(d => d.totalStaff + d.newJoiners), 5);
    
    const layers = [
      { key: 'joiners', label: 'Joiners', color: 'url(#gradientJoiners)', dataKey: (d: any) => d.totalStaff + d.newJoiners },
      { key: 'leave', label: 'On Leave', color: 'url(#gradientLeaves)', dataKey: (d: any) => d.totalStaff },
      { key: 'active', label: 'Active Staff', color: 'url(#gradientPresent)', dataKey: (d: any) => d.totalStaff - d.onLeave }
    ];

    return layers.map(layer => {
      const points = this.pulseData.map((d, i) => ({
        x: (i / (this.pulseData.length - 1)) * width,
        y: height - (layer.dataKey(d) / maxVal) * (height - 30) - 10
      }));

      // Generate smooth cubic bezier path
      let path = `M0,${height} L${points[0].x},${points[0].y}`;
      
      for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const cp1x = curr.x + (next.x - curr.x) / 2;
        const cp2x = curr.x + (next.x - curr.x) / 2;
        path += ` C${cp1x},${curr.y} ${cp2x},${next.y} ${next.x},${next.y}`;
      }
      
      path += ` L${width},${height} Z`;
      return { ...layer, path };
    });
  }

  getTrendPath(): string {
    return ''; // Legacy, can be removed
  }
}
