import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api/office-locations';

export interface OfficeLocation {
  _id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class OfficeLocationService {
  constructor(private http: HttpClient) { }

  getAll(): Observable<OfficeLocation[]> {
    return this.http.get<OfficeLocation[]>(API_URL);
  }

  getActive(): Observable<OfficeLocation[]> {
    return this.http.get<OfficeLocation[]>(`${API_URL}/active`);
  }

  getById(id: string): Observable<OfficeLocation> {
    return this.http.get<OfficeLocation>(`${API_URL}/${id}`);
  }

  create(location: OfficeLocation): Observable<any> {
    return this.http.post(API_URL, location);
  }

  update(id: string, location: Partial<OfficeLocation>): Observable<any> {
    return this.http.put(`${API_URL}/${id}`, location);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/${id}`);
  }
}
