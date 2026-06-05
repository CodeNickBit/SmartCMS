import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedSidebarComponent } from '../components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../components/header/header.component';

interface TeamMember {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  phone: string;
  joiningDate: string;
  active_inactive: boolean;
  workLocation?: string;
  employmentType?: string;
}

@Component({
  selector: 'app-my-team',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedSidebarComponent, SharedHeaderComponent],
  templateUrl: './my-team.component.html',
  styleUrl: './my-team.component.css'
})
export class MyTeamComponent implements OnInit {
  teamMembers: TeamMember[] = [];
  filteredTeamMembers: TeamMember[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  managerName: string = '';
  searchQuery: string = '';
  filterDepartment: string = 'all';
  filterStatus: string = 'all';

  departments: string[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.managerName = user.name || `${user.firstName} ${user.lastName}`;
      }
      this.loadTeamMembers();
    }
  }

  loadTeamMembers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<TeamMember[]>('http://localhost:3000/api/auth/my-team').subscribe({
      next: (data) => {
        this.teamMembers = data;
        this.filteredTeamMembers = data;
        this.extractDepartments();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading team members:', error);
        this.errorMessage = error.error?.message || 'Failed to load team members';
        this.isLoading = false;
      }
    });
  }

  extractDepartments(): void {
    const deptSet = new Set(this.teamMembers.map(m => m.department).filter(d => d));
    this.departments = Array.from(deptSet).sort();
  }

  applyFilters(): void {
    this.filteredTeamMembers = this.teamMembers.filter(member => {
      const matchesSearch = !this.searchQuery || 
        member.firstName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        member.lastName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        member.employeeId.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesDepartment = this.filterDepartment === 'all' || member.department === this.filterDepartment;
      
      const matchesStatus = this.filterStatus === 'all' || 
        (this.filterStatus === 'active' && member.active_inactive !== false) ||
        (this.filterStatus === 'inactive' && member.active_inactive === false);

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onDepartmentChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  getStatusBadgeClass(active: boolean): string {
    return active !== false ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
  }

  getStatusText(active: boolean): string {
    return active !== false ? 'Active' : 'Inactive';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  get activeCount(): number {
    return this.teamMembers.filter(m => m.active_inactive !== false).length;
  }

  get inactiveCount(): number {
    return this.teamMembers.filter(m => m.active_inactive === false).length;
  }

  viewWorkflow(id: string): void {
    this.router.navigate(['/dashboard/employee-workflow', id]);
  }
}
