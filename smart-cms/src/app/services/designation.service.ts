import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api/designation';

export interface Designation {
  _id?: string;
  title: string;
  description?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DesignationService {
  constructor(private http: HttpClient) { }

  addDesignation(data: Designation): Observable<any> {
    return this.http.post(API_URL, data);
  }

  getDesignations(): Observable<Designation[]> {
    return this.http.get<Designation[]>(API_URL);
  }

  updateDesignation(id: string, data: Designation): Observable<any> {
    return this.http.put(`${API_URL}/${id}`, data);
  }

  deleteDesignation(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/${id}`);
  }
}
