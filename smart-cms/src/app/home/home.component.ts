import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { OfficeLocationService } from '../services/office-location.service';
import { AttendanceService, AttendanceRecord } from '../services/attendance.service';

export interface Task {
  id: number;
  title: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: Date;
}

export interface LeaveBalance {
  type: string;
  total: number;
  used: number;
  available: number;
}

export interface Attendance {
  status: 'Clocked In' | 'Clocked Out';
  checkInTime?: Date;
  checkOutTime?: Date;
  totalHours: string;
  location?: { lat: number; lng: number };
  address?: string;
  distance?: number;
  approvalStatus?: 'pending' | 'approved' | 'declined' | 'marked_late';
}

export interface Payslip {
  id: string;
  month: string;
  year: number;
  netPay: number;
  downloadUrl: string;
}

interface OfficeLocation {
  _id?: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  userProfile: any = null;
  currentDate: Date = new Date();

  attendance: Attendance = {
    status: 'Clocked Out',
    totalHours: '00:00'
  };

  isProcessingAttendance: boolean = false;
  attendanceMessage: string = '';
  attendanceError: string = '';

  officeLocations: OfficeLocation[] = [];

  leaveBalances: LeaveBalance[] = [
    { type: 'Casual Leave', total: 12, used: 2, available: 10 },
    { type: 'Sick Leave', total: 10, used: 1, available: 9 },
    { type: 'Privilege Leave', total: 15, used: 0, available: 15 }
  ];

  tasks: Task[] = [
    { id: 1, title: 'Complete Q1 Report', status: 'In Progress', priority: 'High', dueDate: new Date() },
    { id: 2, title: 'Update Client Profile', status: 'To Do', priority: 'Medium', dueDate: new Date(new Date().setDate(new Date().getDate() + 2)) },
    { id: 3, title: 'Team Meeting Prep', status: 'Done', priority: 'Low', dueDate: new Date(new Date().setDate(new Date().getDate() - 1)) }
  ];

  recentPayslip: Payslip = {
    id: 'PAY-JAN-2025',
    month: 'January',
    year: 2025,
    netPay: 45000,
    downloadUrl: '#'
  };

    constructor(
    private router: Router,
    private authService: AuthService,
    private officeLocationService: OfficeLocationService,
    private attendanceService: AttendanceService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.userProfile = this.authService.getUser();

    if (!this.userProfile) {
      this.userProfile = {
        firstName: 'Guest',
        lastName: 'User',
        designation: 'Software Engineer',
        department: 'Engineering'
      };
    }

    if (isPlatformBrowser(this.platformId)) {
      this.loadOfficeLocations();
      this.loadTodayAttendance();
    }
  }

  loadTodayAttendance() {
    this.attendanceService.getTodayAttendance().subscribe({
      next: (record) => {
        if (record) {
          this.attendance = {
            status: record.checkOut ? 'Clocked Out' : (record.checkIn ? 'Clocked In' : 'Clocked Out'),
            checkInTime: record.checkIn ? new Date(record.checkIn.time) : undefined,
            checkOutTime: record.checkOut ? new Date(record.checkOut.time) : undefined,
            totalHours: record.workingHours ? this.formatWorkingHours(record.workingHours) : '00:00',
            location: record.checkIn ? { lat: record.checkIn.location.latitude, lng: record.checkIn.location.longitude } : undefined,
            address: record.checkIn ? record.checkIn.address : undefined,
            distance: record.checkIn ? record.checkIn.distance : undefined,
            approvalStatus: record.approvalStatus
          };
        }
      },
      error: (error) => {
        console.error('Error loading today attendance:', error);
      }
    });
  }

  formatWorkingHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  loadOfficeLocations() {
    this.officeLocationService.getActive().subscribe({
      next: (locations) => {
        this.officeLocations = locations.map(loc => ({
          _id: loc._id,
          name: loc.name,
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
          radius: Number(loc.radius)
        }));
      },
      error: (error: any) => {
        console.error('Error loading office locations:', error);

        // LOG DEBUG INFO FROM BACKEND
        if (error.error?.debug) {
          console.error('🔍 BACKEND DEBUG INFO:');
          console.error('  Token Role:', error.error.debug.tokenRole);
          console.error('  Token ID:', error.error.debug.tokenId);
          console.error('  Queried Collection:', error.error.debug.queriedCollection);
          console.error('  ⚠️ This user ID was NOT FOUND in the database!');
        }

        // FAIL-SAFE: Use hardcoded locations if API fails to prevent white screen/logout loop
        // This is temporary for debugging until backend auth is fixed
        this.attendanceError = 'Using offline mode for locations due to connection error.';
        this.officeLocations = [
          { name: 'Head Office', latitude: 22.991104, longitude: 72.487986, radius: 100 }, // Updated to Gujarat coordinates
          { name: 'Branch Office', latitude: 23.0225, longitude: 72.5714, radius: 150 }
        ];

        if (error.status === 401) {
          console.warn('Authentication failed for locations, but staying on page for debugging.');
          // this.authService.logout();
          // this.router.navigate(['/login']);
        }
      }
    });
  }

  toggleAttendance(): void {
    if (this.attendance.status === 'Clocked Out') {
      this.checkIn();
    } else {
      this.checkOut();
    }
  }

  checkIn(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isProcessingAttendance = true;
    this.attendanceError = '';
    this.attendanceMessage = '';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.validateLocationAndCheckIn(lat, lng);
        },
        (error) => {
          this.isProcessingAttendance = false;
          this.handleLocationError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      this.isProcessingAttendance = false;
      this.attendanceError = 'Geolocation is not supported by your browser';
    }
  }

  validateLocationAndCheckIn(lat: number, lng: number): void {
    if (!this.officeLocations || this.officeLocations.length === 0) {
      this.isProcessingAttendance = false;
      this.attendanceError = 'No office locations found. Please try again later or contact admin.';
      return;
    }

    const result = this.findNearestOffice(lat, lng);

    if (result.isWithinGeofence) {
      this.getAddressAndCompleteCheckIn(lat, lng, result.distance, result.office.name);
    } else {
      this.isProcessingAttendance = false;
      // Detailed error message with coordinates
      this.attendanceError = `You are ${Math.round(result.distance)}m away from ${result.office.name}. 
      (User: ${lat.toFixed(6)}, ${lng.toFixed(6)})
      (Office: ${result.office.latitude.toFixed(6)}, ${result.office.longitude.toFixed(6)})`;
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

  getAddressAndCompleteCheckIn(lat: number, lng: number, distance: number, officeName: string): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    fetch(url, {
      headers: {
        'User-Agent': 'SmartCMS/1.0'
      }
    })
      .then(response => response.json())
      .then(data => {
        const address = this.formatAddress(data.address);
        this.completeCheckIn(lat, lng, address, distance, officeName);
      })
      .catch(error => {
        console.error('Error fetching address:', error);
        this.completeCheckIn(lat, lng, 'Address not available', distance, officeName);
      });
  }

  formatAddress(addressData: any): string {
    const parts = [];
    if (addressData.road) parts.push(addressData.road);
    if (addressData.suburb) parts.push(addressData.suburb);
    if (addressData.city) parts.push(addressData.city);
    return parts.join(', ') || 'Address not found';
  }

  completeCheckIn(lat: number, lng: number, address: string, distance: number, officeName: string): void {
    const result = this.findNearestOffice(lat, lng);
    const officeLocationId = result.office._id || '';

    this.attendanceService.checkIn({
      latitude: lat,
      longitude: lng,
      address,
      distance,
      officeLocationId
    }).subscribe({
      next: (response) => {
        this.attendance = {
          status: 'Clocked In',
          checkInTime: new Date(),
          totalHours: '00:00',
          location: { lat, lng },
          address,
          distance,
          approvalStatus: 'pending'
        };

        this.isProcessingAttendance = false;
        this.attendanceMessage = `Checked in successfully at ${officeName}! Status: Pending Approval`;
        setTimeout(() => this.attendanceMessage = '', 5000);
      },
      error: (error) => {
        this.isProcessingAttendance = false;
        this.attendanceError = error.error?.message || 'Failed to check in';
        setTimeout(() => this.attendanceError = '', 5000);
      }
    });
  }

  checkOut(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isProcessingAttendance = true;
    this.attendanceError = '';
    this.attendanceMessage = '';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.completeCheckOut(lat, lng);
        },
        (error) => {
          this.isProcessingAttendance = false;
          // Even if location fails, try to check out with 0,0 or previous location
          this.completeCheckOut(0, 0);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      this.isProcessingAttendance = false;
      this.completeCheckOut(0, 0);
    }
  }

  completeCheckOut(lat: number, lng: number): void {
    this.attendanceService.checkOut({
      latitude: lat,
      longitude: lng,
      address: this.attendance.address || 'Unknown'
    }).subscribe({
      next: (response) => {
        if (this.attendance.checkInTime) {
          this.attendance.status = 'Clocked Out';
          this.attendance.checkOutTime = new Date();

          const checkInTime = this.attendance.checkInTime.getTime();
          const checkOutTime = this.attendance.checkOutTime.getTime();
          const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);

          this.attendance.totalHours = this.formatWorkingHours(hoursWorked);
          this.isProcessingAttendance = false;
          this.attendanceMessage = `Checked out successfully! Total: ${this.attendance.totalHours}`;
          setTimeout(() => this.attendanceMessage = '', 5000);

          // Refresh to get final status/hours from backend
          this.loadTodayAttendance();
        }
      },
      error: (error) => {
        this.isProcessingAttendance = false;
        this.attendanceError = error.error?.message || 'Failed to check out';
        setTimeout(() => this.attendanceError = '', 5000);
      }
    });
  }

  handleLocationError(error: GeolocationPositionError): void {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.attendanceError = 'Location permission denied. Please enable location access.';
        break;
      case error.POSITION_UNAVAILABLE:
        this.attendanceError = 'Location information unavailable.';
        break;
      case error.TIMEOUT:
        this.attendanceError = 'Location request timed out.';
        break;
      default:
        this.attendanceError = 'An error occurred while getting your location.';
    }
    setTimeout(() => this.attendanceError = '', 5000);
  }

  updateTaskStatus(task: Task): void {
    if (task.status === 'To Do') task.status = 'In Progress';
    else if (task.status === 'In Progress') task.status = 'Done';
    else if (task.status === 'Done') task.status = 'To Do';
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'High': return '#EF4444'; // Red
      case 'Medium': return '#EE964B'; // Orange
      case 'Low': return '#10B981'; // Green
      default: return '#9CA3AF';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Done': return '#10B981'; // Green
      case 'In Progress': return '#3083DC'; // Blue
      case 'To Do': return '#6B7280'; // Gray
      default: return '#9CA3AF';
    }
  }

  onApplyLeave(): void {
    console.log('Open Apply Leave Modal');
    // Logic to open modal would go here
  }

  downloadPayslip(id: string): void {
    console.log('Downloading payslip:', id);
    // Logic to download generic PDF or nav to payslip view
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
