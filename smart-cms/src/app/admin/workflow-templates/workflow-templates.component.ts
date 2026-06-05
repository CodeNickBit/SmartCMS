import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowTemplateService, WorkflowTemplate } from '../../services/workflow-template.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';
import { SharedSidebarComponent } from '../../dashboard/components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-workflow-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, AdminHeaderComponent, SharedSidebarComponent, SharedHeaderComponent],
  templateUrl: './workflow-templates.component.html',
  styleUrls: ['./workflow-templates.component.css']
})
export class WorkflowTemplatesComponent implements OnInit {
  templates: WorkflowTemplate[] = [];
  isEditing = false;
  currentTemplate: WorkflowTemplate = {
    name: '',
    type: 'onboarding',
    isActive: true,
    tasks: []
  };

  userRole: string = 'admin';
  departments: any[] = [];

  constructor(
    private workflowTemplateService: WorkflowTemplateService, 
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userRole = user.role || 'admin';
    }
    this.loadTemplates();
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.http.get<any[]>('http://localhost:3000/api/department').subscribe({
      next: (data) => {
        this.departments = data;
      },
      error: (err) => console.error('Error fetching departments', err)
    });
  }

  loadTemplates(): void {
    this.workflowTemplateService.getAllTemplates().subscribe({
      next: (data) => this.templates = data,
      error: (err) => console.error('Error loading templates', err)
    });
  }

  openEditor(template?: WorkflowTemplate): void {
    this.isEditing = true;
    if (template) {
      this.currentTemplate = JSON.parse(JSON.stringify(template));
    } else {
      this.currentTemplate = { name: '', type: 'onboarding', isActive: true, tasks: [] };
    }
  }

  closeEditor(): void {
    this.isEditing = false;
  }

  addTask(): void {
    this.currentTemplate.tasks.push({
      title: '',
      assignedToRole: 'Admin',
      estimatedHours: 1
    });
  }

  removeTask(index: number): void {
    this.currentTemplate.tasks.splice(index, 1);
  }

  saveTemplate(): void {
    if (this.currentTemplate._id) {
      this.workflowTemplateService.updateTemplate(this.currentTemplate._id, this.currentTemplate).subscribe({
        next: () => {
          this.loadTemplates();
          this.closeEditor();
        },
        error: (err) => alert('Error updating template')
      });
    } else {
      this.workflowTemplateService.createTemplate(this.currentTemplate).subscribe({
        next: () => {
          this.loadTemplates();
          this.closeEditor();
        },
        error: (err) => alert('Error creating template')
      });
    }
  }

  deleteTemplate(id?: string): void {
    if (id && confirm('Are you sure you want to delete this template?')) {
      this.workflowTemplateService.deleteTemplate(id).subscribe({
        next: () => this.loadTemplates(),
        error: (err) => alert('Error deleting template')
      });
    }
  }
}
