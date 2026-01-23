import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api/department';

export interface Department {
  _id?: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  constructor(private http: HttpClient) { }

  addDepartment(data: Department): Observable<any> {
    return this.http.post(API_URL, data);
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(API_URL);
  }

  updateDepartment(id: string, data: Department): Observable<any> {
    return this.http.put(`${API_URL}/${id}`, data);
  }

  deleteDepartment(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/${id}`);
  }
}
