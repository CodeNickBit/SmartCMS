import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Expense {
  _id?: string;
  employee?: any;
  amount: number;
  currency?: string;
  category: string;
  expenseDate: string;
  description: string;
  receiptUrl?: string;
  status?: string;
  approvedBy?: any;
  rejectionReason?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  submitExpense(expenseData: FormData): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, expenseData);
  }

  getMyExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/my-expenses`);
  }

  getAllExpenses(status?: string, employeeId?: string): Observable<Expense[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (employeeId) params = params.set('employee', employeeId);
    
    return this.http.get<Expense[]>(this.apiUrl, { params });
  }

  getExpenseById(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/${id}`);
  }

  updateExpenseStatus(id: string, status: string, rejectionReason?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, { status, rejectionReason });
  }

  deleteExpense(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
