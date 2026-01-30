import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LeavePolicy {
    _id?: string;
    leaveName: string;
    description: string;
    allowedRoles: string[]; // 'employee', 'manager', 'hr'
    annualLimit: number;
    minNoticeHours: number; // New field
    isActive: boolean;
}

export interface CompanySettings {
    generalLeaveRules: string[];
}

export interface LeaveRequest {
    _id?: string;
    userId: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    managerId?: string;
    rejectionReason?: string;
    createdAt?: Date;
    userDetails?: any; // For populated user data in manager view
}

@Injectable({
    providedIn: 'root'
})
export class LeavePolicyService {
    private apiUrl = 'http://localhost:3000/api/leave-policy';
    private leaveUrl = 'http://localhost:3000/api/leave';

    constructor(private http: HttpClient) { }

    // Settings
    getSettings(): Observable<CompanySettings> {
        return this.http.get<CompanySettings>(`${this.apiUrl}/settings`);
    }

    updateSettings(settings: CompanySettings): Observable<CompanySettings> {
        return this.http.put<CompanySettings>(`${this.apiUrl}/settings`, settings);
    }

    // Policies
    getPolicies(): Observable<LeavePolicy[]> {
        return this.http.get<LeavePolicy[]>(this.apiUrl);
    }

    createPolicy(policy: LeavePolicy): Observable<LeavePolicy> {
        return this.http.post<LeavePolicy>(this.apiUrl, policy);
    }

    updatePolicy(id: string, policy: Partial<LeavePolicy>): Observable<LeavePolicy> {
        return this.http.put<LeavePolicy>(`${this.apiUrl}/${id}`, policy);
    }

    deletePolicy(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }


    // Leave Requests
    applyForLeave(leaveData: any): Observable<LeaveRequest> {
        return this.http.post<LeaveRequest>(`${this.leaveUrl}/apply`, leaveData);
    }

    getMyLeaves(userId: string): Observable<LeaveRequest[]> {
        return this.http.get<LeaveRequest[]>(`${this.leaveUrl}/my-leaves/${userId}`);
    }

    getManagerLeaves(managerId: string): Observable<LeaveRequest[]> {
        return this.http.get<LeaveRequest[]>(`${this.leaveUrl}/manager-requests/${managerId}`);
    }

    getTeamCalendar(managerId: string): Observable<LeaveRequest[]> {
        return this.http.get<LeaveRequest[]>(`${this.leaveUrl}/team-calendar/${managerId}`);
    }

    updateLeaveStatus(leaveId: string, status: 'Approved' | 'Rejected' | 'Changes Requested', rejectionReason?: string, managerComments?: string): Observable<any> {
        return this.http.put(`${this.leaveUrl}/${leaveId}/status`, { status, rejectionReason, managerComments });
    }

    updateLeaveRequest(leaveId: string, data: any): Observable<any> {
        return this.http.put(`${this.leaveUrl}/${leaveId}`, data);
    }

    getYearEndPreview(): Observable<any> {
        return this.http.get<any>(`${this.leaveUrl}/year-end/preview`);
    }

    executeYearEnd(year: number): Observable<any> {
        return this.http.post<any>(`${this.leaveUrl}/year-end/execute`, { year });
    }

    cancelLeave(id: string): Observable<any> {
        return this.http.post(`${this.leaveUrl}/cancel/${id}`, {});
    }
}
