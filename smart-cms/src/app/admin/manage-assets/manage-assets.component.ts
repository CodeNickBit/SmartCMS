import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AssetService, Asset } from '../../services/asset.service';
import { AuthService } from '../../services/auth.service';
import { CompanySettingsService } from '../../services/company-settings.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-manage-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminSidebarComponent, AdminHeaderComponent],
  templateUrl: './manage-assets.component.html',
  styleUrls: ['./manage-assets.component.css']
})
export class ManageAssetsComponent implements OnInit {
  assets: Asset[] = [];
  users: any[] = [];
  categories: string[] = ['Laptop', 'Monitor', 'Mobile', 'Keyboard/Mouse', 'Software License', 'Other'];
  searchQuery: string = '';
  
  showModal = false;
  showAssignModal = false;
  showReturnModal = false;
  
  assetForm: FormGroup;
  selectedAsset: Asset | null = null;
  assignUserId = '';
  returnNotes = '';

  constructor(
    private assetService: AssetService,
    private authService: AuthService,
    private settingsService: CompanySettingsService,
    private fb: FormBuilder
  ) {
    this.assetForm = this.fb.group({
      name: ['', Validators.required],
      serialNumber: ['', Validators.required],
      category: ['Laptop', Validators.required],
      status: ['Available'],
      purchaseDate: [''],
      purchaseCost: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadAssets();
    this.loadUsers();
    this.loadCategories();
  }

  loadAssets() {
    this.assetService.getAllAssets().subscribe({
      next: (data: any) => this.assets = data,
      error: (err: any) => console.error('Error fetching assets', err)
    });
  }

  loadUsers() {
    // Assuming authService.getUsers() exists and returns all users
    this.authService.getUsers().subscribe({
      next: (data: any) => this.users = data,
      error: (err: any) => console.error('Error fetching users', err)
    });
  }

  loadCategories() {
    this.settingsService.getSettings().subscribe({
      next: (settings: any) => {
        if (settings && settings.assetCategories && settings.assetCategories.length > 0) {
          this.categories = settings.assetCategories;
        }
      },
      error: (err: any) => console.error('Error fetching settings', err)
    });
  }

  openAddModal() {
    this.assetForm.reset({ category: this.categories[0], status: 'Available' });
    this.selectedAsset = null;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onSubmit() {
    if (this.assetForm.invalid) return;

    if (this.selectedAsset) {
      this.assetService.updateAsset(this.selectedAsset._id!, this.assetForm.value).subscribe({
        next: () => {
          this.loadAssets();
          this.closeModal();
        },
        error: (err: any) => alert(err.error?.message || 'Error updating asset')
      });
    } else {
      this.assetService.createAsset(this.assetForm.value).subscribe({
        next: () => {
          this.loadAssets();
          this.closeModal();
        },
        error: (err: any) => alert(err.error?.message || 'Error creating asset')
      });
    }
  }

  openAssignModal(asset: Asset) {
    this.selectedAsset = asset;
    this.assignUserId = '';
    this.showAssignModal = true;
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.selectedAsset = null;
  }

  assignAsset() {
    if (!this.assignUserId || !this.selectedAsset) return;
    this.assetService.assignAsset(this.selectedAsset._id!, this.assignUserId).subscribe({
      next: () => {
        this.loadAssets();
        this.closeAssignModal();
      },
      error: (err: any) => alert(err.error?.message || 'Error assigning asset')
    });
  }

  openReturnModal(asset: Asset) {
    this.selectedAsset = asset;
    this.returnNotes = '';
    this.showReturnModal = true;
  }

  closeReturnModal() {
    this.showReturnModal = false;
    this.selectedAsset = null;
  }

  returnAsset() {
    if (!this.selectedAsset) return;
    this.assetService.returnAsset(this.selectedAsset._id!, this.returnNotes).subscribe({
      next: () => {
        this.loadAssets();
        this.closeReturnModal();
      },
      error: (err: any) => alert(err.error?.message || 'Error returning asset')
    });
  }

  deleteAsset(id: string) {
    if(confirm('Are you sure you want to delete this asset?')) {
      this.assetService.deleteAsset(id).subscribe({
        next: () => this.loadAssets(),
        error: (err: any) => alert(err.error?.message || 'Error deleting asset')
      });
    }
  }
}
