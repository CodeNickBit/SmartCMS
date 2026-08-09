import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const BASE_URL = 'http://localhost:3000/api';
export interface WorkflowTemplateTask {
  _id?: string;
  title: string;
  description?: string;
  assignedToRole: 'Admin' | 'Hr' | 'Manager' | 'Reporting_Manager';
  department?: string;
  estimatedHours?: number;
}

export interface WorkflowTemplate {
  _id?: string;
  name: string;
  type: 'onboarding' | 'offboarding';
  isActive: boolean;
  tasks: WorkflowTemplateTask[];
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkflowTemplateService {
  private apiUrl = `${BASE_URL}/workflow-templates`;

  constructor(private http: HttpClient) {}

  getAllTemplates(): Observable<WorkflowTemplate[]> {
    return this.http.get<WorkflowTemplate[]>(this.apiUrl);
  }

  getTemplateByType(type: 'onboarding' | 'offboarding'): Observable<WorkflowTemplate[]> {
    return this.http.get<WorkflowTemplate[]>(`${this.apiUrl}/type/${type}`);
  }

  createTemplate(template: WorkflowTemplate): Observable<{ message: string, template: WorkflowTemplate }> {
    return this.http.post<{ message: string, template: WorkflowTemplate }>(this.apiUrl, template);
  }

  updateTemplate(id: string, updates: Partial<WorkflowTemplate>): Observable<{ message: string, template: WorkflowTemplate }> {
    return this.http.put<{ message: string, template: WorkflowTemplate }>(`${this.apiUrl}/${id}`, updates);
  }

  deleteTemplate(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
