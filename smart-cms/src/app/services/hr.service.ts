import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api/hr';

export interface HRRequest {
  name: string;
  email: string;
  password?: string;
  department: string;
  permissions?: {
    canRegisterEmployees: boolean;
    canApproveLeaves: boolean;
    canHandlePayroll: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class HRService {
  constructor(private http: HttpClient) { }

  addHR(data: HRRequest): Observable<any> {
    return this.http.post(`${API_URL}/add`, data);
  }

  getHRs(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/`);
  }

  updateHR(id: string, data: Partial<HRRequest>): Observable<any> {
    return this.http.put(`${API_URL}/${id}`, data);
  }

  deleteHR(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/${id}`);
  }
}
