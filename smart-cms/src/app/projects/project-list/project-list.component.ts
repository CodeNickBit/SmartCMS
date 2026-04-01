import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { SharedSidebarComponent } from '../../dashboard/components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';
import { AdminSidebarComponent } from '../../admin/components/sidebar/sidebar.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SharedSidebarComponent, AdminSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-[#101935] text-white font-sans overflow-hidden">
      <app-admin-sidebar *ngIf="isAdmin" class="flex-shrink-0"></app-admin-sidebar>
      <app-shared-sidebar *ngIf="!isAdmin" class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header title="Projects"></app-shared-header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar bg-[#101935]">
          <div class="project-list-page">
            <div class="page-header">
        <div class="header-left">
          <h1>Projects</h1>
          <p class="subtitle">Manage and track all your projects</p>
        </div>
        <button class="btn-primary" *ngIf="canCreate" (click)="router.navigate(['/projects/new'])">
          <span class="icon">+</span> New Project
        </button>
      </div>

      <div class="filters-bar">
        <input class="search-input" type="text" placeholder="Search projects..." [(ngModel)]="filters.search" (ngModelChange)="loadProjects()">
        <select [(ngModel)]="filters.status" (ngModelChange)="loadProjects()">
          <option value="">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        <select [(ngModel)]="filters.priority" (ngModelChange)="loadProjects()">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading projects...</p>
      </div>

      <div class="projects-grid" *ngIf="!loading">
        <div class="empty-state" *ngIf="projects.length === 0">
          <div class="empty-icon">📁</div>
          <h3>No projects found</h3>
          <p>{{ canCreate ? 'Create your first project to get started.' : 'You have not been added to any projects yet.' }}</p>
          <button class="btn-primary" *ngIf="canCreate" (click)="router.navigate(['/projects/new'])">Create Project</button>
        </div>

        <div class="project-card" *ngFor="let p of projects" (click)="router.navigate(['/projects', p._id])">
          <div class="card-header">
            <div class="project-title-row">
              <h3>{{ p.title }}</h3>
              <span class="priority-badge" [ngClass]="'priority-' + p.priority">{{ p.priority }}</span>
            </div>
            <span class="status-badge" [ngClass]="'status-' + p.status">{{ formatStatus(p.status) }}</span>
          </div>
          <p class="project-desc">{{ p.description || 'No description provided.' }}</p>
          <div class="task-progress" *ngIf="p.taskStats">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" [style.width.%]="getProgressPct(p.taskStats)"></div>
            </div>
            <span class="progress-label">{{ p.taskStats.done || 0 }}/{{ p.taskStats.total || 0 }} tasks done</span>
          </div>
          <div class="card-footer">
            <div class="members-count">
              <span class="icon">👥</span> {{ p.members?.length || 0 }} members
            </div>
            <div class="dates" *ngIf="p.endDate">
              <span class="icon">📅</span> Due {{ p.endDate | date:'mediumDate' }}
            </div>
          </div>
        </div>
      </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #1B264F; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3083DC; }
    
    .project-list-page { max-width: 1200px; margin: 0 auto; width: 100%; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .header-left h1 { font-size: 28px; font-weight: 700; color: white; margin: 0; }
    .subtitle { color: #94a3b8; margin: 4px 0 0; font-size: 14px; }
    .btn-primary { background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: opacity 0.2s; width: max-content; height: max-content; white-space: nowrap; }
    .btn-primary:hover { opacity: 0.88; }
    .filters-bar { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 200px; padding: 10px 14px; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; background: #1B264F; color: white; }
    .search-input:focus { border-color: #3b82f6; }
    select { padding: 10px 14px; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 8px; font-size: 14px; background: #1B264F; color: white; cursor: pointer; outline: none; }
    select:focus { border-color: #3b82f6; }
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #94a3b8; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(30, 58, 138, 0.3); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .project-card { background: #1B264F; border-radius: 14px; padding: 22px; border: 1px solid rgba(30, 58, 138, 0.3); cursor: pointer; transition: border-color 0.2s, transform 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .project-card:hover { border-color: rgba(59, 130, 246, 0.5); transform: translateY(-2px); }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 8px; }
    .project-title-row { display: flex; align-items: center; gap: 8px; flex: 1; }
    .project-title-row h3 { font-size: 16px; font-weight: 600; color: white; margin: 0; }
    .status-badge, .priority-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; white-space: nowrap; text-transform: capitalize; }
    .status-planning { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .status-active { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .status-on_hold { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .status-completed { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .status-archived { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
    .priority-low { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .priority-medium { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .priority-high { background: rgba(234, 88, 12, 0.2); color: #f97316; }
    .priority-critical { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .project-desc { font-size: 13px; color: #94a3b8; margin: 0 0 14px; line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .task-progress { margin-bottom: 14px; }
    .progress-bar-bg { background: rgba(30, 58, 138, 0.3); border-radius: 99px; height: 6px; overflow: hidden; margin-bottom: 6px; }
    .progress-bar-fill { background: linear-gradient(90deg, #3b82f6, #6366f1); height: 100%; border-radius: 99px; transition: width 0.4s; }
    .progress-label { font-size: 12px; color: #94a3b8; }
    .card-footer { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #94a3b8; border-top: 1px solid rgba(30, 58, 138, 0.3); padding-top: 12px; margin-top: 4px; }
    .members-count, .dates { display: flex; align-items: center; gap: 4px; }
    .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; margin: 0 auto; grid-column: 1 / -1; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.8; }
    .empty-state h3 { color: white; margin-bottom: 8px; }
    .empty-state .btn-primary { margin: 0 auto; }
  `]
})
export class ProjectListComponent implements OnInit {
  projects: any[] = [];
  loading = false;
  canCreate = false;
  userRole: string = '';
  isAdmin: boolean = false;
  filters: any = { search: '', status: '', priority: '' };

  constructor(public router: Router, private projectService: ProjectService, private auth: AuthService) {}

  ngOnInit() {
    const user = this.auth.getUser();
    this.userRole = user?.role?.toLowerCase() || '';
    this.isAdmin = this.userRole === 'admin';
    this.canCreate = this.isAdmin || this.userRole === 'manager';
    this.loadProjects();
  }

  loadProjects() {
    this.loading = true;
    this.projectService.getAll(this.filters).subscribe({
      next: (data) => { this.projects = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  formatStatus(s: string) { return s?.replace('_', ' ') || ''; }

  getProgressPct(stats: any): number {
    if (!stats || !stats.total) return 0;
    return Math.round((stats.done / stats.total) * 100);
  }
}
