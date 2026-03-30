import { Component, Inject, PLATFORM_ID, OnInit, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';
import { OfficeLocationService, OfficeLocation } from '../../services/office-location.service';

@Component({
  selector: 'app-attendance-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminSidebarComponent,
    AdminHeaderComponent
  ],
  templateUrl: './attendance-settings.component.html',
  styleUrl: './attendance-settings.component.css'
})
export class AttendanceSettingsComponent implements OnInit {
  searchQuery: string = '';
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  isGettingLocation: boolean = false;

  officeLocations: OfficeLocation[] = [];

  newLocation: OfficeLocation = {
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    radius: 100,
    isActive: true,
    timezone: 'Asia/Kolkata'
  };

  editingLocation: OfficeLocation = {
    _id: '',
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    radius: 100,
    isActive: true,
    timezone: 'Asia/Kolkata'
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private officeLocationService: OfficeLocationService
  ) {
    afterNextRender(() => {
      this.loadLocations();
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadLocations();
    }
  }

  loadLocations() {
    this.officeLocationService.getAll().subscribe({
      next: (locations) => {
        this.officeLocations = locations;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.errorMessage = 'Failed to load office locations';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  get filteredLocations() {
    return this.officeLocations.filter(loc =>
      loc.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  openAddModal() {
    this.showAddModal = true;
    this.errorMessage = '';
    this.newLocation = {
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      radius: 100,
      isActive: true,
      timezone: 'Asia/Kolkata'
    };
  }

  closeAddModal() {
    this.showAddModal = false;
    this.newLocation = {
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      radius: 100,
      isActive: true,
      timezone: 'Asia/Kolkata'
    };
  }

  getCurrentLocation(isEdit: boolean = false) {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isGettingLocation = true;
    this.errorMessage = '';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (isEdit) {
            this.editingLocation.latitude = lat;
            this.editingLocation.longitude = lng;
            this.getAddressFromCoordinates(lat, lng, true);
          } else {
            this.newLocation.latitude = lat;
            this.newLocation.longitude = lng;
            this.getAddressFromCoordinates(lat, lng, false);
          }
          
          this.isGettingLocation = false;
          this.successMessage = 'Location captured successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        (error) => {
          this.isGettingLocation = false;
          switch(error.code) {
            case error.PERMISSION_DENIED:
              this.errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              this.errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              this.errorMessage = 'Location request timed out.';
              break;
            default:
              this.errorMessage = 'An error occurred while getting location.';
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      this.isGettingLocation = false;
      this.errorMessage = 'Geolocation is not supported by this browser.';
    }
  }

  getAddressFromCoordinates(lat: number, lng: number, isEdit: boolean = false) {
    if (!isPlatformBrowser(this.platformId)) return;

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    fetch(url, {
      headers: {
        'User-Agent': 'SmartCMS/1.0'
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data && data.display_name) {
          const address = this.formatAddress(data.address);
          if (isEdit) {
            this.editingLocation.address = address;
          } else {
            this.newLocation.address = address;
          }
        }
      })
      .catch(error => {
        console.error('Error fetching address:', error);
      });
  }

  formatAddress(addressData: any): string {
    const parts = [];
    
    if (addressData.road) parts.push(addressData.road);
    if (addressData.suburb) parts.push(addressData.suburb);
    if (addressData.city) parts.push(addressData.city);
    if (addressData.state) parts.push(addressData.state);
    if (addressData.postcode) parts.push(addressData.postcode);
    
    return parts.join(', ') || addressData.display_name || 'Address not found';
  }

  fetchAddressManually(isEdit: boolean = false) {
    const lat = isEdit ? this.editingLocation.latitude : this.newLocation.latitude;
    const lng = isEdit ? this.editingLocation.longitude : this.newLocation.longitude;

    if (lat === 0 || lng === 0) {
      this.errorMessage = 'Please enter valid coordinates first';
      return;
    }

    this.getAddressFromCoordinates(lat, lng, isEdit);
    this.successMessage = 'Fetching address...';
    setTimeout(() => this.successMessage = '', 2000);
  }

  submitLocation() {
    if (!this.newLocation.name.trim()) {
      this.errorMessage = 'Office name is required';
      return;
    }
    if (!this.newLocation.address.trim()) {
      this.errorMessage = 'Address is required';
      return;
    }
    if (this.newLocation.latitude === 0 || this.newLocation.longitude === 0) {
      this.errorMessage = 'Please set valid coordinates';
      return;
    }
    if (this.newLocation.radius < 50 || this.newLocation.radius > 1000) {
      this.errorMessage = 'Radius must be between 50 and 1000 meters';
      return;
    }

    const locationData = {
      name: this.newLocation.name,
      address: this.newLocation.address,
      latitude: Number(this.newLocation.latitude),
      longitude: Number(this.newLocation.longitude),
      radius: Number(this.newLocation.radius),
      isActive: this.newLocation.isActive,
      timezone: this.newLocation.timezone || 'Asia/Kolkata'
    };

    this.officeLocationService.create(locationData).subscribe({
      next: (response) => {
        this.successMessage = 'Office location added successfully!';
        this.closeAddModal();
        this.loadLocations();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error creating location:', error);
        this.errorMessage = error.error?.message || 'Failed to create office location';
      }
    });
  }

  editLocation(location: OfficeLocation) {
    this.editingLocation = { ...location };
    this.showEditModal = true;
    this.errorMessage = '';
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  updateLocation() {
    if (!this.editingLocation.name.trim()) {
      this.errorMessage = 'Office name is required';
      return;
    }
    if (!this.editingLocation.address.trim()) {
      this.errorMessage = 'Address is required';
      return;
    }
    if (this.editingLocation.radius < 50 || this.editingLocation.radius > 1000) {
      this.errorMessage = 'Radius must be between 50 and 1000 meters';
      return;
    }

    if (!this.editingLocation._id) {
      this.errorMessage = 'Invalid location ID';
      return;
    }

    const locationData = {
      name: this.editingLocation.name,
      address: this.editingLocation.address,
      latitude: Number(this.editingLocation.latitude),
      longitude: Number(this.editingLocation.longitude),
      radius: Number(this.editingLocation.radius),
      isActive: this.editingLocation.isActive,
      timezone: this.editingLocation.timezone || 'Asia/Kolkata'
    };

    this.officeLocationService.update(this.editingLocation._id, locationData).subscribe({
      next: (response) => {
        this.successMessage = 'Office location updated successfully!';
        this.closeEditModal();
        this.loadLocations();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating location:', error);
        this.errorMessage = error.error?.message || 'Failed to update office location';
      }
    });
  }

  toggleStatus(location: OfficeLocation) {
    if (!location._id) return;

    const newStatus = !location.isActive;
    this.officeLocationService.update(location._id, { isActive: newStatus }).subscribe({
      next: (response) => {
        this.successMessage = `Location ${newStatus ? 'activated' : 'deactivated'} successfully!`;
        this.loadLocations();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error toggling status:', error);
        this.errorMessage = error.error?.message || 'Failed to update location status';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  deleteLocation(location: OfficeLocation) {
    if (!location._id) return;

    if (confirm(`Are you sure you want to delete ${location.name}?`)) {
      this.officeLocationService.delete(location._id).subscribe({
        next: (response) => {
          this.successMessage = 'Office location deleted successfully!';
          this.loadLocations();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error deleting location:', error);
          this.errorMessage = error.error?.message || 'Failed to delete office location';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  openInMaps(lat: number, lng: number) {
    if (isPlatformBrowser(this.platformId)) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  }
}
