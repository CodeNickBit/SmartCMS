import { Component, Inject, PLATFORM_ID, OnInit, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DepartmentService, Department } from '../../services/department.service';
import { DesignationService, Designation } from '../../services/designation.service';
import { ManagerService, Manager } from '../../services/manager.service';
import { PayrollService, SalaryTemplate } from '../../services/payroll.service';
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
  dbSalaryTemplates: SalaryTemplate[] = [];
  activeManagers: Manager[] = [];
  standardWorkHours: number = 8;
  shiftTimeOptions: { value: string; label: string }[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private router: Router,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private confirmationModal: ConfirmationModalService,
    private managerService: ManagerService,
    private payrollService: PayrollService
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
      this.loadSalaryTemplates();
      this.loadPayrollSettings();
    }
  }

  loadSalaryTemplates() {
    this.payrollService.getTemplates().subscribe({
      next: (data) => {
        this.dbSalaryTemplates = data;
      },
      error: (error) => {
        console.error('Error fetching templates:', error);
      }
    });
  }

  loadPayrollSettings() {
    this.payrollService.getPayrollSettings().subscribe({
      next: (data) => {
        if (data?.payrollSettings?.overtimeRules?.standardWorkHoursPerDay) {
          this.standardWorkHours = data.payrollSettings.overtimeRules.standardWorkHoursPerDay;
        }
      },
      error: (error) => console.error('Error fetching payroll settings', error)
    });
  }

  onShiftTypeChange() {
    if (!this.editingEmployee) return;
    
    const shiftType = this.editingEmployee.shiftType;
    this.editingEmployee.workingHoursStart = '';
    this.editingEmployee.workingHoursEnd = '';
    
    if (shiftType === 'day') {
      this.shiftTimeOptions = [
        { value: '09:00', label: '9:00 AM - ' + this.calculateEndTimeLabel('09:00') },
        { value: '10:00', label: '10:00 AM - ' + this.calculateEndTimeLabel('10:00') },
        { value: '11:00', label: '11:00 AM - ' + this.calculateEndTimeLabel('11:00') }
      ];
    } else if (shiftType === 'night') {
      this.shiftTimeOptions = [
        { value: '20:00', label: '8:00 PM - ' + this.calculateEndTimeLabel('20:00') },
        { value: '21:00', label: '9:00 PM - ' + this.calculateEndTimeLabel('21:00') },
        { value: '22:00', label: '10:00 PM - ' + this.calculateEndTimeLabel('22:00') }
      ];
    } else {
      this.shiftTimeOptions = [];
    }
  }

  calculateEndTimeLabel(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = (hours + this.standardWorkHours) % 24;
    const period = endHour >= 12 ? 'PM' : 'AM';
    const displayHour = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  onWorkingHoursStartChange() {
    if (!this.editingEmployee || !this.editingEmployee.workingHoursStart) return;

    const startTime = this.editingEmployee.workingHoursStart;
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = hours + this.standardWorkHours;
    const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    this.editingEmployee.workingHoursEnd = endTime;
  }

  loadEmployees() {
    this.authService.getUsers().subscribe({
      next: (data: any[]) => {
        // Filter to only show regular employees (exclude admin, hr, manager roles)
        this.employees = data.filter(emp => 
          emp.role === 'employee' || !emp.role || emp.role === ''
        );
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
    this.managerService.getActiveManagers().subscribe({
      next: (data) => {
        this.activeManagers = data;
      },
      error: (error) => {
        console.error('Error fetching managers:', error);
      }
    });
  }

  onDepartmentChange() {
    if (this.editingEmployee && this.editingEmployee.department) {
      // Only reset manager selections when user explicitly changes department
      this.editingEmployee.reportingManager = '';
      this.editingEmployee.backupManager = '';
      this.loadManagersByDepartment(this.editingEmployee.department);
    }
  }

  loadManagersByDepartment(department: string) {
    this.managerService.getActiveManagers(department).subscribe({
      next: (data) => {
        this.activeManagers = data;
        
        // Ensure current assigned manager stays in list even if not from matching department
        if (this.editingEmployee && this.editingEmployee.reportingManager) {
           const rmFound = this.activeManagers.find((m: any) => m._id === this.editingEmployee.reportingManager);
           if (!rmFound && this.editingEmployee.reportingManager !== '') {
               // We don't have the manager details since it's just an ID from the backend,
               // but we can push a stub option to allow the dropdown to reflect the current value.
               this.activeManagers.push({ _id: this.editingEmployee.reportingManager, name: 'Assigned RM', department: 'Other' } as Manager);
           }
        }
        
        if (this.editingEmployee && this.editingEmployee.backupManager) {
           const bmFound = this.activeManagers.find((m: any) => m._id === this.editingEmployee.backupManager);
           if (!bmFound && this.editingEmployee.backupManager !== '') {
               this.activeManagers.push({ _id: this.editingEmployee.backupManager, name: 'Assigned BM', department: 'Other' } as Manager);
           }
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
    this.authService.getUserById(emp._id).subscribe({
      next: (fullUser) => {
        this.editingEmployee = { ...fullUser };
        
        if (!this.editingEmployee.reportingManager) this.editingEmployee.reportingManager = '';
        if (!this.editingEmployee.backupManager) this.editingEmployee.backupManager = '';
        if (!this.editingEmployee.salaryTemplate) this.editingEmployee.salaryTemplate = '';
        
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
      },
      error: (err) => {
        console.error('Failed to fetch full employee details', err);
      }
    });
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
