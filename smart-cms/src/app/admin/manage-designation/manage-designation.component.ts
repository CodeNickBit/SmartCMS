import { Component, Inject, PLATFORM_ID, OnInit, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DesignationService, Designation } from '../../services/designation.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-manage-designation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminSidebarComponent,
    AdminHeaderComponent
  ],
  templateUrl: './manage-designation.component.html',
  styleUrl: './manage-designation.component.css'
})
export class ManageDesignationComponent implements OnInit {
  showModal: boolean = false;
  showEditModal: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  searchQuery: string = '';

  designations: Designation[] = [];
  newDesignation: Designation = {
    title: '',
    description: ''
  };

  editingDesignation: Designation = {
    _id: '',
    title: '',
    description: ''
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private designationService: DesignationService) {
    afterNextRender(() => {
      this.loadDesignations();
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDesignations();
    }
  }

  loadDesignations() {
    this.designationService.getDesignations().subscribe({
      next: (data) => {
        this.designations = data;
      },
      error: (error) => {
        console.error('Error fetching designations:', error);
      }
    });
  }

  get filteredDesignations() {
    return this.designations.filter(desig => 
      desig.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      (desig.description && desig.description.toLowerCase().includes(this.searchQuery.toLowerCase()))
    );
  }

  openModal() {
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal() {
    this.showModal = false;
    this.newDesignation = { title: '', description: '' };
  }

  submitDesignation() {
    if (!this.newDesignation.title.trim()) {
      this.errorMessage = 'Designation title is required';
      return;
    }

    this.designationService.addDesignation(this.newDesignation).subscribe({
      next: () => {
        this.successMessage = 'Designation added successfully';
        this.closeModal();
        this.loadDesignations();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to add designation';
      }
    });
  }

  editDesignation(desig: Designation) {
    this.editingDesignation = { ...desig };
    this.showEditModal = true;
    this.errorMessage = '';
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  updateDesignation() {
    if (!this.editingDesignation.title.trim()) {
      this.errorMessage = 'Designation title is required';
      return;
    }

    if (this.editingDesignation._id) {
      this.designationService.updateDesignation(this.editingDesignation._id, this.editingDesignation).subscribe({
        next: () => {
          this.successMessage = 'Designation updated successfully';
          this.closeEditModal();
          this.loadDesignations();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to update designation';
        }
      });
    }
  }

  confirmDelete(desig: Designation) {
    if (confirm(`Are you sure you want to delete designation ${desig.title}?`)) {
      if (desig._id) {
        this.designationService.deleteDesignation(desig._id).subscribe({
          next: () => {
            this.successMessage = 'Designation deleted successfully';
            this.loadDesignations();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (error) => {
            this.errorMessage = error.error?.message || 'Failed to delete designation';
          }
        });
      }
    }
  }
}
