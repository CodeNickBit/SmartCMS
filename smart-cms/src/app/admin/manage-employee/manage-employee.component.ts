import { Component, Inject, PLATFORM_ID, OnInit, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DepartmentService, Department } from '../../services/department.service';
import { DesignationService, Designation } from '../../services/designation.service';
import { ManagerService, Manager } from '../../services/manager.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';
import { ConfirmationModalService } from '../../shared/confirmation-modal.service';

@Component({
  selector: 'app-manage-employee',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminSidebarComponent,
    AdminHeaderComponent
  ],
  templateUrl: './manage-employee.component.html',
  styleUrl: './manage-employee.component.css'
})
export class ManageEmployeeComponent implements OnInit {
  employees: any[] = [];
  searchQuery: string = '';
  filterStatus: string = 'All';

  isEditing: boolean = false;
  editingEmployee: any = null;

  dbDepartments: Department[] = [];
  dbDesignations: Designation[] = [];
  activeManagers: Manager[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private router: Router,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private confirmationModal: ConfirmationModalService
    private managerService: ManagerService
  ) {
    afterNextRender(() => {
      this.loadEmployees();
      this.loadDepartments();
      this.loadDesignations();
      this.loadManagers();
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadEmployees();
      this.loadDepartments();
      this.loadDesignations();
      this.loadManagers();
    }
  }

  loadEmployees() {
    this.authService.getUsers().subscribe({
      next: (data: any[]) => {
        this.employees = data;
      },
      error: (err: any) => {
        console.error('Failed to fetch employees', err);
      }
    });
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data) => {
        this.dbDepartments = data;
      },
      error: (error) => {
        console.error('Error fetching departments:', error);
      }
    });
  }

  loadDesignations() {
    this.designationService.getDesignations().subscribe({
      next: (data) => {
        this.dbDesignations = data;
      },
      error: (error) => {
        console.error('Error fetching designations:', error);
      }
    });
  }

  loadManagers() {
    console.log('Loading all active managers...');
    this.managerService.getActiveManagers().subscribe({
      next: (data) => {
        console.log('Managers loaded:', data);
        this.activeManagers = data;
      },
      error: (error) => {
        console.error('Error fetching managers:', error);
      }
    });
  }

  onDepartmentChange() {
    console.log('Department changed:', this.editingEmployee?.department);
    if (this.editingEmployee && this.editingEmployee.department) {
      this.loadManagersByDepartment(this.editingEmployee.department);
    }
  }

  loadManagersByDepartment(department: string) {
    console.log('Loading managers for department:', department);
    this.managerService.getActiveManagers(department).subscribe({
      next: (data) => {
        console.log('Filtered managers:', data);
        this.activeManagers = data;
        if (this.editingEmployee && !data.find(m => m.name === this.editingEmployee.reportingManager)) {
          this.editingEmployee.reportingManager = '';
        }
      },
      error: (error) => {
        console.error('Error fetching managers:', error);
      }
    });
  }

  get filteredEmployees() {
    return this.employees.filter(emp => {
      const name = emp.name || `${emp.firstName} ${emp.lastName}` || '';
      const matchesSearch = name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (emp.email && emp.email.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(this.searchQuery.toLowerCase()));
      
      const status = emp.active_inactive !== false ? 'Active' : 'Inactive';
      const matchesStatus = this.filterStatus === 'All' || status === this.filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }

  setStatusFilter(status: string) {
    this.filterStatus = status;
  }

  getDisplayName(emp: any): string {
    return emp.name || (emp.firstName ? `${emp.firstName} ${emp.lastName}` : 'N/A');
  }

  // Actions
  editEmployee(emp: any) {
    this.editingEmployee = { ...emp };
    if (this.editingEmployee.joiningDate) {
      const date = new Date(this.editingEmployee.joiningDate);
      if (!isNaN(date.getTime())) {
        this.editingEmployee.joiningDate = date.toISOString().split('T')[0];
      }
    }
    this.isEditing = true;
    if (this.editingEmployee.department) {
      this.loadManagersByDepartment(this.editingEmployee.department);
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingEmployee = null;
  }

  saveEmployee() {
    if (!this.editingEmployee) return;

    this.authService.updateUser(this.editingEmployee._id, this.editingEmployee).subscribe({
      next: () => {
        this.loadEmployees();
        this.isEditing = false;
        this.editingEmployee = null;
      },
      error: (err: any) => {
        console.error('Update failed', err);
      }
    });
  }

  toggleStatus(emp: any) {
    const newStatus = emp.active_inactive === false;
    this.authService.updateUserStatus(emp._id, newStatus).subscribe({
      next: () => {
        this.loadEmployees();
      },
      error: (err: any) => {
        console.error('Status update failed', err);
      }
    });
  }

  deleteEmployee(emp: any) {
    const employeeName = this.getDisplayName(emp);
    this.confirmationModal.confirm({
      title: 'Delete Employee',
      message: 'Are you sure you want to permanently delete ' + employeeName + '?',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'warning'
    }).then(confirmed => {
      if (!confirmed) return;
      this.authService.deleteUser(emp._id).subscribe({
        next: () => this.loadEmployees(),
        error: (err: any) => console.error('Delete failed', err)
      });
    });
  }

  navigateToRegister() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('adminRegistering', 'true');
    }
    this.router.navigate(['/signup']);
  }
}
