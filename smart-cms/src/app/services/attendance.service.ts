import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api/attendance';

export interface AttendanceRecord {
  _id?: string;
  employeeId: string | any; // Can be populated
  date: Date;
  checkIn?: {
    time: Date;
    location: { latitude: number; longitude: number };
    address: string;
    distance: number;
    officeLocation: string;
  };
  checkOut?: {
    time: Date;
    location: { latitude: number; longitude: number };
    address: string;
  };
  status: 'present' | 'absent' | 'late' | 'half-day';
  workingHours?: number;
  // Manager Approval Fields
  approvalStatus: 'pending' | 'approved' | 'declined' | 'marked_late';
  approvedBy?: string;
  approvedAt?: Date;
  managerNotes?: string;
  // Escalation Fields
  escalation?: {
    isEscalated: boolean;
    originalManagerName: string;
    reason: string;
    escalatedToManagerName: string;
    escalatedToManagerDepartment: string;
  };
}


@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  constructor(private http: HttpClient) { }

  getTodayAttendance(): Observable<AttendanceRecord> {
    return this.http.get<AttendanceRecord>(`${API_URL}/today`);
  }

  checkIn(data: {
    latitude: number;
    longitude: number;
    address: string;
    distance: number;
    officeLocationId: string;
  }): Observable<any> {
    return this.http.post(`${API_URL}/check-in`, data);
  }

  checkOut(data: {
    latitude: number;
    longitude: number;
    address: string;
  }): Observable<any> {
    return this.http.post(`${API_URL}/check-out`, data);
  }

  getMyAttendance(startDate?: string, endDate?: string): Observable<AttendanceRecord[]> {
    let params = {};
    if (startDate) params = { ...params, startDate };
    if (endDate) params = { ...params, endDate };
    return this.http.get<AttendanceRecord[]>(`${API_URL}/my-attendance`, { params });
  }

  // ==================== MANAGER APPROVAL METHODS ====================

  getPendingApprovals(limit = 50, skip = 0): Observable<any> {
    return this.http.get<any>(`${API_URL}/pending-approvals`, {
      params: { limit: limit.toString(), skip: skip.toString() }
    });
  }

  approveAttendance(attendanceId: string, notes?: string): Observable<any> {
    return this.http.post(`${API_URL}/approve/${attendanceId}`, { notes });
  }

  declineAttendance(attendanceId: string, notes?: string): Observable<any> {
    return this.http.post(`${API_URL}/decline/${attendanceId}`, { notes });
  }

  markAsLate(attendanceId: string, notes?: string): Observable<any> {
    return this.http.post(`${API_URL}/mark-late/${attendanceId}`, { notes });
  }

  getApprovalHistory(limit = 30, skip = 0): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${API_URL}/approval-history`, {
      params: { limit: limit.toString(), skip: skip.toString() }
    });
  }

  getEscalationLog(params?: any): Observable<any> {
    return this.http.get<any>(`${API_URL}/escalation-log`, { params });
  }

  getMyEscalations(limit = 30): Observable<any> {
    return this.http.get<any>(`${API_URL}/my-escalations`, {
      params: { limit: limit.toString() }
    });
  }
}
