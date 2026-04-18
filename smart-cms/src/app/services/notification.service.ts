import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api/notifications';

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  category: 'Task' | 'Leave' | 'Attendance' | 'Payroll' | 'System' | 'General';
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(API_URL, { headers: this.getHeaders() });
  }

  markAsRead(id: string): Observable<any> {
    return this.http.put(`${API_URL}/${id}/read`, {}, { headers: this.getHeaders() });
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${API_URL}/read-all`, {}, { headers: this.getHeaders() });
  }

  deleteNotification(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/${id}`, { headers: this.getHeaders() });
  }
}
