import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  statsCards: Array<{
    title: string;
    value: string;
    change: string;
    icon: string;
    color: string;
    iconBg?: string;
    text?: string;
  }>;
  pulseData: Array<{ 
    day: string; 
    totalStaff: number; 
    onLeave: number; 
    newJoiners: number;
  }>;
  departmentData: Array<{ name: string; value: number; color: string }>;
  recentActivities: Array<{
    name: string;
    action: string;
    date: string;
    status: string;
    statusColor: string;
    avatar?: string;
  }>;
  pendingApprovals: Array<{
    title: string;
    subtitle: string;
    meta: string;
    icon: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getAdminStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin-stats`);
  }
}
