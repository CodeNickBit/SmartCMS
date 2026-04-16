import { Component, Inject, PLATFORM_ID, OnInit, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SharedSidebarComponent } from '../components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../components/header/header.component';
import { OfficeLocationService } from '../../services/office-location.service';
import { AttendanceService, AttendanceRecord } from '../../services/attendance.service';

interface OfficeLocation {
  _id?: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    SharedSidebarComponent,
    SharedHeaderComponent
  ],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css'
})
export class AttendanceComponent implements OnInit {
  isCheckingIn: boolean = false;
  isCheckingOut: boolean = false;
  isLoading: boolean = true;
  currentLocation: { lat: number; lng: number } | null = null;

  todayAttendance: AttendanceRecord | null = null;
  nearestOffice: OfficeLocation | null = null;
  distanceFromOffice: number = 0;

  successMessage: string = '';
  errorMessage: string = '';

  officeLocations: OfficeLocation[] = [];
  today: Date = new Date();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private officeLocationService: OfficeLocationService,
    private attendanceService: AttendanceService
  ) {
    afterNextRender(() => {
      this.loadOfficeLocations();
      this.loadTodayAttendance();
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadOfficeLocations();
      this.loadTodayAttendance();
    }
  }

  loadOfficeLocations() {
    this.officeLocationService.getActive().subscribe({
      next: (locations) => {
        console.log('📍 Raw office locations from API:', locations);
        this.officeLocations = locations.map(loc => ({
          _id: loc._id,
          name: loc.name,
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
          radius: Number(loc.radius)
        }));
        console.log('📍 Processed office locations:', this.officeLocations);
      },
      error: (error) => {
        console.error('Error loading office locations:', error);
        this.errorMessage = 'Failed to load office locations';
      }
    });
  }

  loadTodayAttendance() {
    this.isLoading = true;
    this.attendanceService.getTodayAttendance().subscribe({
      next: (attendance) => {
        this.todayAttendance = attendance;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading today attendance:', error);
        this.isLoading = false;
      }
    });
  }

  get hasCheckedIn(): boolean {
    return !!this.todayAttendance?.checkIn;
  }

  get hasCheckedOut(): boolean {
    return !!this.todayAttendance?.checkOut;
  }

  get canCheckIn(): boolean {
    // Disable if already checked in, currently checking in, loading, OR if status is pending/approved
    return !this.hasCheckedIn &&
      !this.isCheckingIn &&
      !this.isLoading &&
      this.todayAttendance?.approvalStatus !== 'pending' &&
      this.todayAttendance?.approvalStatus !== 'approved';
  }

  get canCheckOut(): boolean {
    return this.hasCheckedIn && !this.hasCheckedOut && !this.isCheckingOut && !this.isLoading;
  }

  checkIn() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isCheckingIn = true;
    this.errorMessage = '';
    this.successMessage = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.currentLocation = { lat, lng };
        this.validateLocationAndCheckIn(lat, lng);
      },
      (error) => {
        this.isCheckingIn = false;
        this.handleLocationError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  validateLocationAndCheckIn(lat: number, lng: number) {
    console.log('🧭 User current location:', { lat, lng });

    if (this.officeLocations.length === 0) {
      this.isCheckingIn = false;
      this.errorMessage = 'No active office locations found. Please contact admin.';
      return;
    }

    try {
      const result = this.findNearestOffice(lat, lng);
      console.log('📏 Distance calculation result:', {
        office: result.office.name,
        officeCoords: { lat: result.office.latitude, lng: result.office.longitude },
        userCoords: { lat, lng },
        distance: result.distance,
        radius: result.office.radius,
        isWithinGeofence: result.isWithinGeofence
      });

      this.nearestOffice = result.office;
      this.distanceFromOffice = result.distance;

      if (result.isWithinGeofence) {
        this.getAddressAndCompleteCheckIn(lat, lng, result.distance, result.office._id!);
      } else {
        this.isCheckingIn = false;
        // Debugging: Show coordinates in the error message
        this.errorMessage = `You are ${Math.round(result.distance)}m away from ${result.office.name}. 
        (User: ${lat.toFixed(6)}, ${lng.toFixed(6)}) 
        (Office: ${result.office.latitude.toFixed(6)}, ${result.office.longitude.toFixed(6)})`;
      }
    } catch (error) {
      this.isCheckingIn = false;
      this.errorMessage = 'Error validating location. Please try again.';
      console.error('Validation error:', error);
    }
  }

  findNearestOffice(lat: number, lng: number): { office: OfficeLocation; distance: number; isWithinGeofence: boolean } {
    let nearest = this.officeLocations[0];
    let minDistance = this.calculateDistance(lat, lng, nearest.latitude, nearest.longitude);

    for (const office of this.officeLocations) {
      const distance = this.calculateDistance(lat, lng, office.latitude, office.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = office;
      }
    }

    return {
      office: nearest,
      distance: minDistance,
      isWithinGeofence: minDistance <= nearest.radius
    };
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  getAddressAndCompleteCheckIn(lat: number, lng: number, distance: number, officeId: string) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    fetch(url, { headers: { 'User-Agent': 'SmartCMS/1.0' } })
      .then(response => response.json())
      .then(data => {
        const address = this.formatAddress(data.address);
        this.completeCheckIn(lat, lng, address, distance, officeId);
      })
      .catch(() => {
        this.completeCheckIn(lat, lng, 'Address not available', distance, officeId);
      });
  }

  formatAddress(addressData: any): string {
    const parts = [];
    if (addressData.road) parts.push(addressData.road);
    if (addressData.suburb) parts.push(addressData.suburb);
    if (addressData.city) parts.push(addressData.city);
    return parts.join(', ') || 'Address not found';
  }

  completeCheckIn(lat: number, lng: number, address: string, distance: number, officeLocationId: string) {
    this.attendanceService.checkIn({
      latitude: lat,
      longitude: lng,
      address,
      distance,
      officeLocationId
    }).subscribe({
      next: (response) => {
        this.todayAttendance = response.attendance;
        this.isCheckingIn = false;
        this.successMessage = 'Check-in successful! Awaiting manager approval.';

        // Refresh data to ensure all UI states are sync
        this.loadTodayAttendance();

        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (error) => {
        this.isCheckingIn = false;
        this.errorMessage = error.error?.message || 'Check-in failed. Please try again.';
      }
    });
  }

  checkOut() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isCheckingOut = true;
    this.errorMessage = '';
    this.successMessage = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.getAddressAndCompleteCheckOut(lat, lng);
      },
      (error) => {
        this.isCheckingOut = false;
        this.handleLocationError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  getAddressAndCompleteCheckOut(lat: number, lng: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    fetch(url, { headers: { 'User-Agent': 'SmartCMS/1.0' } })
      .then(response => response.json())
      .then(data => {
        const address = this.formatAddress(data.address);
        this.completeCheckOut(lat, lng, address);
      })
      .catch(() => {
        this.completeCheckOut(lat, lng, 'Address not available');
      });
  }

  completeCheckOut(lat: number, lng: number, address: string) {
    this.attendanceService.checkOut({
      latitude: lat,
      longitude: lng,
      address
    }).subscribe({
      next: (response) => {
        this.todayAttendance = response.attendance;
        this.isCheckingOut = false;
        this.successMessage = 'Check-out successful!';
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (error) => {
        this.isCheckingOut = false;
        this.errorMessage = error.error?.message || 'Check-out failed. Please try again.';
      }
    });
  }

  formatWorkingHours(hours: number): string {
    let h = Math.floor(hours);
    let m = Math.round((hours - h) * 60);
    if (m === 60) {
      h += 1;
      m = 0;
    }
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  handleLocationError(error: GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.errorMessage = 'Location permission denied. Please enable location access.';
        break;
      case error.POSITION_UNAVAILABLE:
        this.errorMessage = 'Location information unavailable. Please try again.';
        break;
      case error.TIMEOUT:
        this.errorMessage = 'Location request timed out. Please try again.';
        break;
      default:
        this.errorMessage = 'An error occurred while getting your location.';
    }
  }
}
