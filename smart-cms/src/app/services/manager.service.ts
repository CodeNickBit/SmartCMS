import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api/manager';

export interface Manager {
  _id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  isActive: boolean;
}

export interface ManagerRegistrationRequest {
  name: string;
  email: string;
  temporaryPassword: string;
  department: string;
  designation: string;
  joiningDate?: string;
}

export interface ManagerUpdateRequest {
  email?: string;
  department?: string;
  designation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ManagerService {
  constructor(private http: HttpClient) {}

  getActiveManagers(department?: string): Observable<Manager[]> {
    let url = `${API_URL}/active`;
    if (department) {
      url += `?department=${encodeURIComponent(department)}`;
    }
    return this.http.get<Manager[]>(url);
  }

  getAllManagers(): Observable<Manager[]> {
    return this.http.get<Manager[]>(API_URL);
  }

  getManagers(): Observable<Manager[]> {
    return this.getAllManagers();
  }

  registerManager(manager: ManagerRegistrationRequest): Observable<any> {
    return this.http.post(`${API_URL}/register`, manager);
  }

  updateManager(id: string, updates: ManagerUpdateRequest): Observable<any> {
    return this.http.put(`${API_URL}/${id}`, updates);
  }

  deleteManager(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/${id}`);
  }
}
