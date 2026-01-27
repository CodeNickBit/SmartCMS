import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HRService, HRRequest } from '../../services/hr.service';
import { DepartmentService, Department } from '../../services/department.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-manage-hr',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminSidebarComponent,
    AdminHeaderComponent
  ],
  templateUrl: './manage-hr.component.html',
  styleUrl: './manage-hr.component.css'
})
export class ManageHRComponent implements OnInit {
  showModal: boolean = false;
  showEditModal: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  searchQuery: string = '';

  hrs: any[] = [];
  departments: Department[] = [];
  
  newHR: HRRequest = {
    name: '',
    email: '',
    password: '',
    department: '',
    permissions: {
      canRegisterEmployees: true,
      canApproveLeaves: true,
      canHandlePayroll: true
    }
  };

  editingHR: any = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private hrService: HRService,
    private departmentService: DepartmentService
  ) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadHRs();
      this.loadDepartments();
    }
  }

  loadHRs() {
    this.hrService.getHRs().subscribe({
      next: (data) => {
        this.hrs = data;
      },
      error: (error) => {
        console.error('Error fetching HRs:', error);
      }
    });
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data) => {
        this.departments = data;
      },
      error: (error) => {
        console.error('Error fetching departments:', error);
      }
    });
  }

  get filteredHRs() {
    return this.hrs.filter(hr => 
      hr.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      hr.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      hr.department.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  openModal() {
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal() {
    this.showModal = false;
    this.newHR = {
      name: '',
      email: '',
      password: '',
      department: '',
      permissions: {
        canRegisterEmployees: true,
        canApproveLeaves: true,
        canHandlePayroll: true
      }
    };
  }

  submitHR() {
    if (!this.newHR.name || !this.newHR.email || !this.newHR.password || !this.newHR.department) {
      this.errorMessage = 'All fields are required';
      return;
    }

    this.hrService.addHR(this.newHR).subscribe({
      next: () => {
        this.successMessage = 'HR added successfully';
        this.closeModal();
        this.loadHRs();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to add HR';
      }
    });
  }

  editHR(hr: any) {
    this.editingHR = { ...hr };
    this.showEditModal = true;
    this.errorMessage = '';
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingHR = null;
  }

  updateHR() {
    if (!this.editingHR.name || !this.editingHR.email || !this.editingHR.department) {
      this.errorMessage = 'Name, Email and Department are required';
      return;
    }

    this.hrService.updateHR(this.editingHR._id, this.editingHR).subscribe({
      next: () => {
        this.successMessage = 'HR updated successfully';
        this.closeEditModal();
        this.loadHRs();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to update HR';
      }
    });
  }

  confirmDelete(hr: any) {
    if (confirm(`Are you sure you want to deactivate HR ${hr.name}?`)) {
      this.hrService.deleteHR(hr._id).subscribe({
        next: () => {
          this.successMessage = 'HR deactivated successfully';
          this.loadHRs();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to deactivate HR';
        }
      });
    }
  }
}
