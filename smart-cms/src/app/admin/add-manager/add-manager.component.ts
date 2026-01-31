import { Component, Inject, PLATFORM_ID, OnInit, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerService, ManagerRegistrationRequest } from '../../services/manager.service';
import { DepartmentService, Department } from '../../services/department.service';
import { DesignationService, Designation } from '../../services/designation.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';
import { ConfirmationModalService } from '../../shared/confirmation-modal.service';

@Component({
  selector: 'app-add-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminSidebarComponent,
    AdminHeaderComponent
  ],
  templateUrl: './add-manager.component.html',
  styleUrl: './add-manager.component.css'
})
export class AddManagerComponent implements OnInit {
  showModal: boolean = false;
  showEditModal: boolean = false;
  showPassword: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  newManager: ManagerRegistrationRequest = {
    name: '',
    email: '',
    temporaryPassword: '',
    department: '',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0]
  };

  editingManager: any = {
    id: '',
    email: '',
    department: '',
    designation: ''
  };

  dbDepartments: Department[] = [];
  dbDesignations: Designation[] = [];

  filterDept: string = 'All';
  searchQuery: string = '';
  managers: any[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private managerService: ManagerService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private confirmationModal: ConfirmationModalService
  ) {
    afterNextRender(() => {
      this.loadManagers();
      this.loadDepartments();
      this.loadDesignations();
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadManagers();
      this.loadDepartments();
      this.loadDesignations();
    }
  }

  loadManagers() {
    this.managerService.getManagers().subscribe({
      next: (data) => {
        this.managers = data;
      },
      error: (error) => {
        console.error('Error fetching managers:', error);
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

  get filteredManagers() {
    return this.managers.filter(manager => {
      const matchesDept = this.filterDept === 'All' || manager.department.toLowerCase() === this.filterDept.toLowerCase();
      const matchesSearch = manager.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        manager.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }

  setDept(dept: string) {
    this.filterDept = dept;
  }

  openModal() {
    this.showModal = true;
    this.showPassword = false;
    this.errorMessage = '';
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  errors: { [key: string]: string } = {};

  validateForm(): boolean {
    this.errors = {};
    if (!this.newManager.name.trim()) this.errors['name'] = 'Name is required';
    if (!this.newManager.email.trim()) {
      this.errors['email'] = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(this.newManager.email)) {
      this.errors['email'] = 'Invalid email format';
    }
    if (!this.newManager.temporaryPassword) {
      this.errors['password'] = 'Temporary password is required';
    } else if (this.newManager.temporaryPassword.length < 8) {
      this.errors['password'] = 'Password must be at least 8 characters';
    }
    if (!this.newManager.department) this.errors['department'] = 'Department is required';
    if (!this.newManager.designation) this.errors['designation'] = 'Designation is required';
    
    return Object.keys(this.errors).length === 0;
  }

  editManager(manager: any) {
    this.editingManager = {
      id: manager._id || manager.id,
      email: manager.email,
      department: manager.department,
      designation: manager.designation,
      name: manager.name
    };
    this.showEditModal = true;
    this.errorMessage = '';
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingManager = { id: '', email: '', department: '', designation: '' };
  }

  updateManager() {
    if (!this.editingManager.email || !this.editingManager.department || !this.editingManager.designation) {
      this.errorMessage = 'All fields are required';
      return;
    }

    this.managerService.updateManager(this.editingManager.id, {
      email: this.editingManager.email,
      department: this.editingManager.department,
      designation: this.editingManager.designation
    }).subscribe({
      next: () => {
        this.successMessage = 'Manager updated successfully';
        this.closeEditModal();
        this.loadManagers();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to update manager';
      }
    });
  }

  confirmDelete(manager: any) {
    this.confirmationModal.confirm({
      title: 'Delete Manager',
      message: 'Are you sure you want to delete manager ' + manager.name + '?',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'warning'
    }).then(confirmed => {
      if (!confirmed) return;
      const id = manager._id || manager.id;
      this.managerService.deleteManager(id).subscribe({
        next: () => {
          this.successMessage = 'Manager deleted successfully';
          this.loadManagers();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to delete manager';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    });
  }

  submitManager() {
    if (!this.validateForm()) return;

    this.managerService.registerManager(this.newManager).subscribe({
      next: (response) => {
        this.successMessage = `Successfully registered manager: ${this.newManager.name}`;
        this.closeModal();
        this.loadManagers();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to register manager';
      }
    });
  }

  resetForm() {
    this.newManager = {
      name: '',
      email: '',
      temporaryPassword: '',
      department: '',
      designation: '',
      joiningDate: new Date().toISOString().split('T')[0]
    };
    this.errors = {};
  }
}
