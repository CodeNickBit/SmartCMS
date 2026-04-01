import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api/projects';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getAll(filters?: { status?: string; priority?: string; department?: string; search?: string }): Observable<any[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, v); });
    }
    return this.http.get<any[]>(API_URL, { headers: this.getHeaders(), params });
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${API_URL}/${id}`, { headers: this.getHeaders() });
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(API_URL, data, { headers: this.getHeaders() });
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${API_URL}/${id}`, data, { headers: this.getHeaders() });
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${API_URL}/${id}`, { headers: this.getHeaders() });
  }

  addMembers(id: string, members: any[]): Observable<any> {
    return this.http.post<any>(`${API_URL}/${id}/members`, { members }, { headers: this.getHeaders() });
  }

  removeMember(projectId: string, memberId: string): Observable<any> {
    return this.http.delete<any>(`${API_URL}/${projectId}/members/${memberId}`, { headers: this.getHeaders() });
  }

  getAnalytics(): Observable<any> {
    return this.http.get<any>(`${API_URL}/analytics`, { headers: this.getHeaders() });
  }
}
