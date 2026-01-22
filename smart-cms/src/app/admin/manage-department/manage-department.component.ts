import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentService, Department } from '../../services/department.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-manage-department',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminSidebarComponent,
    AdminHeaderComponent
  ],
  templateUrl: './manage-department.component.html',
  styleUrl: './manage-department.component.css'
})
export class ManageDepartmentComponent implements OnInit {
  showModal: boolean = false;
  showEditModal: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  searchQuery: string = '';

  departments: Department[] = [];
  newDepartment: Department = {
    name: '',
    description: ''
  };

  editingDepartment: Department = {
    _id: '',
    name: '',
    description: ''
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private departmentService: DepartmentService) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDepartments();
    }
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

  get filteredDepartments() {
    return this.departments.filter(dept => 
      dept.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      (dept.description && dept.description.toLowerCase().includes(this.searchQuery.toLowerCase()))
    );
  }

  openModal() {
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal() {
    this.showModal = false;
    this.newDepartment = { name: '', description: '' };
  }

  submitDepartment() {
    if (!this.newDepartment.name.trim()) {
      this.errorMessage = 'Department name is required';
      return;
    }

    this.departmentService.addDepartment(this.newDepartment).subscribe({
      next: () => {
        this.successMessage = 'Department added successfully';
        this.closeModal();
        this.loadDepartments();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to add department';
      }
    });
  }

  editDepartment(dept: Department) {
    this.editingDepartment = { ...dept };
    this.showEditModal = true;
    this.errorMessage = '';
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  updateDepartment() {
    if (!this.editingDepartment.name.trim()) {
      this.errorMessage = 'Department name is required';
      return;
    }

    if (this.editingDepartment._id) {
      this.departmentService.updateDepartment(this.editingDepartment._id, this.editingDepartment).subscribe({
        next: () => {
          this.successMessage = 'Department updated successfully';
          this.closeEditModal();
          this.loadDepartments();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to update department';
        }
      });
    }
  }

  confirmDelete(dept: Department) {
    if (confirm(`Are you sure you want to delete department ${dept.name}?`)) {
      if (dept._id) {
        this.departmentService.deleteDepartment(dept._id).subscribe({
          next: () => {
            this.successMessage = 'Department deleted successfully';
            this.loadDepartments();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (error) => {
            this.errorMessage = error.error?.message || 'Failed to delete department';
          }
        });
      }
    }
  }
}
