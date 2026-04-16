import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api/payroll';

export interface SalaryComponent {
  _id?: string;
  name: string;
  description?: string;
  type: 'earning' | 'deduction';
  calculationType: 'flat' | 'percentage';
  amountOrPercentage: number;
  percentageOf?: { _id: string; name: string } | null;
  isTaxable: boolean;
  isStatutory: boolean;
  isPartOfGross: boolean;
  isActive: boolean;
  dependsOnAttendance: boolean;
}

export interface SalaryTemplate {
  _id?: string;
  name: string;
  description?: string;
  components: { component: SalaryComponent | string; overrideAmount?: number; }[];
  isActive: boolean;
  isDefaultTemplate: boolean;
}

export interface PayslipComponent {
  component: string;
  name: string;
  type: 'earning' | 'deduction';
  resolvedAmount: number;
  isProRated: boolean;
  isPartOfGross: boolean;
}

export interface Payslip {
  _id?: string;
  employeeId: any;
  payPeriod: { year: number; month: number; startDate: string; endDate: string };
  daysInMonth: number;
  paidDays: number;
  lopDays: number;
  salaryTemplate: any;
  components: PayslipComponent[];
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'locked' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  lockedAt?: string;
  notes?: string;
}

export interface PayrollSettings {
  frequency: 'monthly' | 'bi-weekly' | 'weekly';
  payPeriodStartDay: number;
  salaryDisbursalDay: number;
  lopRules: {
    enabled: boolean;
    considerLateMarksAsLOP: boolean;
    lateMarksThreshold: number;
    absentWithoutApprovalIsLOP: boolean;
  };
  overtimeRules: {
    enabled: boolean;
    standardWorkHoursPerDay: number;
    overtimeMultiplier: number;
    overtimeEarningComponentId?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private apiUrl = API_URL;

  constructor(private http: HttpClient) {}

  getComponents(): Observable<SalaryComponent[]> {
    return this.http.get<SalaryComponent[]>(`${this.apiUrl}/components`);
  }
  createComponent(data: Partial<SalaryComponent>): Observable<any> {
    return this.http.post(`${this.apiUrl}/components`, data);
  }
  updateComponent(id: string, data: Partial<SalaryComponent>): Observable<any> {
    return this.http.put(`${this.apiUrl}/components/${id}`, data);
  }
  deleteComponent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/components/${id}`);
  }

  getTemplates(): Observable<SalaryTemplate[]> {
    return this.http.get<SalaryTemplate[]>(`${this.apiUrl}/templates`);
  }
  createTemplate(data: Partial<SalaryTemplate>): Observable<any> {
    return this.http.post(`${this.apiUrl}/templates`, data);
  }
  updateTemplate(id: string, data: Partial<SalaryTemplate>): Observable<any> {
    return this.http.put(`${this.apiUrl}/templates/${id}`, data);
  }
  deleteTemplate(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/templates/${id}`);
  }

  reviseSalary(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/revise-salary`, data);
  }

  previewEmployeePayroll(employeeId: string, year: number, month: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/preview/${employeeId}?year=${year}&month=${month}`);
  }

  runPayroll(year: number, month: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/run`, { year, month });
  }

  getPayslips(year?: number, month?: number, status?: string): Observable<Payslip[]> {
    const parts: string[] = [];
    if (year) parts.push(`year=${year}`);
    if (month) parts.push(`month=${month}`);
    if (status) parts.push(`status=${status}`);
    const params = parts.length ? '?' + parts.join('&') : '';
    return this.http.get<Payslip[]>(`${this.apiUrl}/payslips${params}`);
  }

  getEmployeePayslips(employeeId: string): Observable<Payslip[]> {
    return this.http.get<Payslip[]>(`${this.apiUrl}/payslips/employee/${employeeId}`);
  }

  getPayslipById(id: string): Observable<Payslip> {
    return this.http.get<Payslip>(`${this.apiUrl}/payslips/${id}`);
  }

  approvePayslip(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payslips/${id}/approve`, {});
  }

  getPayrollAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics`);
  }

  getPayrollSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/company-settings`);
  }

  updatePayrollSettings(data: { payrollSettings: Partial<PayrollSettings> }): Observable<any> {
    return this.http.put(`${this.apiUrl}/company-settings`, data);
  }
}
