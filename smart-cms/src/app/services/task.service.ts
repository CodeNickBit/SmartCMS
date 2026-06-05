import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const BASE_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getProjectTasks(projectId: string, filters?: { status?: string; priority?: string; assignedTo?: string }): Observable<any[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, v); });
    }
    return this.http.get<any[]>(`${BASE_URL}/projects/${projectId}/tasks`, { headers: this.getHeaders(), params });
  }

  getMyTasks(filters?: { status?: string; priority?: string }): Observable<any[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, v); });
    }
    return this.http.get<any[]>(`${BASE_URL}/my-tasks`, { headers: this.getHeaders(), params });
  }

  getWorkflowTasks(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${BASE_URL}/workflow/${userId}`, { headers: this.getHeaders() });
  }

  getById(taskId: string): Observable<any> {
    return this.http.get<any>(`${BASE_URL}/tasks/${taskId}`, { headers: this.getHeaders() });
  }

  create(projectId: string, data: any): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/projects/${projectId}/tasks`, data, { headers: this.getHeaders() });
  }

  update(taskId: string, data: any): Observable<any> {
    return this.http.put<any>(`${BASE_URL}/tasks/${taskId}`, data, { headers: this.getHeaders() });
  }

  updateStatus(taskId: string, status: string): Observable<any> {
    return this.http.put<any>(`${BASE_URL}/tasks/${taskId}`, { status }, { headers: this.getHeaders() });
  }

  delete(taskId: string): Observable<any> {
    return this.http.delete<any>(`${BASE_URL}/tasks/${taskId}`, { headers: this.getHeaders() });
  }

  addComment(taskId: string, text: string): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/tasks/${taskId}/comments`, { text }, { headers: this.getHeaders() });
  }

  logTime(taskId: string, data: { hours: number; date?: string; description?: string }): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/tasks/${taskId}/time-log`, data, { headers: this.getHeaders() });
  }

  getTimeLogs(taskId: string): Observable<any[]> {
    return this.http.get<any[]>(`${BASE_URL}/tasks/${taskId}/time-log`, { headers: this.getHeaders() });
  }

  getSubtasks(taskId: string): Observable<any[]> {
    return this.http.get<any[]>(`${BASE_URL}/tasks/${taskId}/subtasks`, { headers: this.getHeaders() });
  }
}
