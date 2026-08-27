import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Asset {
  _id?: string;
  name: string;
  serialNumber: string;
  category: string;
  status?: string;
  assignedTo?: any;
  assignmentDate?: string;
  returnDate?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  notes?: string;
  isActive?: boolean;
  assignedToModel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private apiUrl = `${environment.apiUrl}/assets`;

  constructor(private http: HttpClient) {}

  getAllAssets(status?: string, assignedTo?: string): Observable<Asset[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (assignedTo) params = params.set('assignedTo', assignedTo);
    
    return this.http.get<Asset[]>(this.apiUrl, { params });
  }

  getMyAssets(): Observable<Asset[]> {
    return this.http.get<Asset[]>(`${this.apiUrl}/my-assets`);
  }

  getAssetById(id: string): Observable<Asset> {
    return this.http.get<Asset>(`${this.apiUrl}/${id}`);
  }

  createAsset(asset: Asset): Observable<Asset> {
    return this.http.post<Asset>(this.apiUrl, asset);
  }

  updateAsset(id: string, asset: Partial<Asset>): Observable<Asset> {
    return this.http.put<Asset>(`${this.apiUrl}/${id}`, asset);
  }

  deleteAsset(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  assignAsset(id: string, assignedTo: string, assignedToModel: string = 'User'): Observable<Asset> {
    return this.http.post<Asset>(`${this.apiUrl}/${id}/assign`, { assignedTo, assignedToModel });
  }

  returnAsset(id: string, notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/return`, { notes });
  }
}
