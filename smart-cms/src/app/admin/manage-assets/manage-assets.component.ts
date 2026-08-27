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
  
  // Dashboard Filters
  statusFilter: string = 'Active';
  roleFilter: string = 'All';
  departmentFilter: string = 'All';

  // Assignment Modal Filters
  assignRoleFilter: string = 'All';
  assignDepartmentFilter: string = 'All';
  
  // Modals
  showModal = false;
  showAssignModal = false;
  showReturnModal = false;
  showInactivateModal = false;
  
  // Category Customization
  showNewCategoryInput = false;
  newCategory = '';

  assetForm: FormGroup;
  selectedAsset: Asset | null = null;
  assetToInactivate: Asset | null = null;
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

  get uniqueDepartments(): string[] {
    const deps = this.users.map(u => u.department).filter(d => !!d);
    return [...new Set(deps)];
  }

  get filteredAssets(): Asset[] {
    return this.assets.filter(a => {
      // 1. Status Filter
      if (this.statusFilter === 'Active' && a.isActive === false) return false;
      if (this.statusFilter === 'Inactive' && a.isActive !== false) return false;

      // 2. Department & Role Filters
      if (this.departmentFilter !== 'All' || this.roleFilter !== 'All') {
        if (!a.assignedTo) return false;
        if (this.departmentFilter !== 'All' && a.assignedTo.department !== this.departmentFilter) return false;
        if (this.roleFilter !== 'All' && a.assignedTo.role !== this.roleFilter.toLowerCase()) return false;
      }

      // 3. Search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const matchesName = a.name.toLowerCase().includes(query);
        const matchesSerial = a.serialNumber.toLowerCase().includes(query);
        let matchesAssigned = false;
        if (a.assignedTo) {
          const assignedName = a.assignedTo.name || `${a.assignedTo.firstName} ${a.assignedTo.lastName}`;
          matchesAssigned = assignedName.toLowerCase().includes(query);
        }
        if (!matchesName && !matchesSerial && !matchesAssigned) return false;
      }
      return true;
    });
  }

  get assignFilteredUsers(): any[] {
    return this.users.filter(u => {
      if (this.assignRoleFilter !== 'All' && u.role !== this.assignRoleFilter.toLowerCase()) return false;
      if (this.assignDepartmentFilter !== 'All' && u.department !== this.assignDepartmentFilter) return false;
      return true;
    });
  }

  resetFilters() {
    this.statusFilter = 'All';
    this.roleFilter = 'All';
    this.departmentFilter = 'All';
    this.searchQuery = '';
  }

  loadAssets() {
    this.assetService.getAllAssets().subscribe({
      next: (data: any) => this.assets = data,
      error: (err: any) => console.error('Error fetching assets', err)
    });
  }

  loadUsers() {
    this.authService.getUsers().subscribe({
      next: (data: any) => {
        this.users = data;
      },
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

  addCustomCategory() {
    if (this.newCategory && this.newCategory.trim() !== '') {
      const cat = this.newCategory.trim();
      if (!this.categories.includes(cat)) {
        this.categories.push(cat);
        // Save to backend
        this.settingsService.updateSettings({ assetCategories: this.categories }).subscribe({
          next: () => console.log('Category added'),
          error: (err: any) => console.error('Failed to save category', err)
        });
      }
      this.assetForm.patchValue({ category: cat });
      this.newCategory = '';
      this.showNewCategoryInput = false;
    }
  }

  openAddModal() {
    this.assetForm.reset({ category: this.categories[0] || 'Laptop', status: 'Available' });
    this.selectedAsset = null;
    this.showNewCategoryInput = false;
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
    this.assignRoleFilter = 'All';
    this.assignDepartmentFilter = 'All';
    this.showAssignModal = true;
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.selectedAsset = null;
  }

  assignAsset() {
    if (!this.assignUserId || !this.selectedAsset) return;
    
    // Find selected user's role to map to assignedToModel
    const user = this.users.find(u => u._id === this.assignUserId);
    if (!user) return;
    
    let model = 'User';
    if (user.role === 'manager') model = 'Manager';
    if (user.role === 'admin') model = 'Admin';
    if (user.role === 'hr') model = 'Hr';

    this.assetService.assignAsset(this.selectedAsset._id!, this.assignUserId, model).subscribe({
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

  openInactivateModal(asset: Asset) {
    this.assetToInactivate = asset;
    this.showInactivateModal = true;
  }

  closeInactivateModal() {
    this.showInactivateModal = false;
    this.assetToInactivate = null;
  }

  inactivateAsset() {
    if (this.assetToInactivate) {
      this.assetService.deleteAsset(this.assetToInactivate._id!).subscribe({
        next: () => {
          this.loadAssets();
          this.closeInactivateModal();
        },
        error: (err: any) => alert(err.error?.message || 'Error inactivating asset')
      });
    }
  }

  activateAsset(asset: Asset) {
    this.assetService.updateAsset(asset._id!, { isActive: true }).subscribe({
      next: () => {
        this.loadAssets();
      },
      error: (err: any) => alert(err.error?.message || 'Error activating asset')
    });
  }
}
