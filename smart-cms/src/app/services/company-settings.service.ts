import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompanySettingsService {
  constructor() { }

  getSettings(): Observable<any> {
    return of({
      assetCategories: ['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Software License'],
      expenseCategories: ['Travel', 'Meals', 'Office Supplies', 'Client Entertainment', 'Training', 'Internet']
    });
  }

  updateSettings(settings: any): Observable<any> {
    return of(settings); // Mock saving for now
  }
}
