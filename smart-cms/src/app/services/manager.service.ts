import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api/manager';

export interface ManagerRegistrationRequest {
  name: string;
  email: string;
  temporaryPassword: string;
  department: string;
  designation: string;
  joiningDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ManagerService {
  constructor(private http: HttpClient) { }

  registerManager(data: ManagerRegistrationRequest): Observable<any> {
    return this.http.post(`${API_URL}/register`, data);
  }

  getManagers(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/`);
  }

  updateManager(id: string, data: any): Observable<any> {
    return this.http.put(`${API_URL}/${id}`, data);
  }

  deleteManager(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/${id}`);
  }
}
