import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { SharedSidebarComponent } from '../../dashboard/components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';
import { AdminSidebarComponent } from '../../admin/components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-project-analytics',
  standalone: true,
  imports: [CommonModule, SharedSidebarComponent, AdminSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-[#101935] text-white font-sans overflow-hidden">
      <app-admin-sidebar *ngIf="isAdmin" class="flex-shrink-0"></app-admin-sidebar>
      <app-shared-sidebar *ngIf="!isAdmin" class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header title="Project Analytics"></app-shared-header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar bg-[#101935]">
          <div class="analytics-page">
            <div class="page-header">
        <h1>Project Analytics</h1>
        <p class="subtitle">Overview of all projects and task performance</p>
      </div>

      <div class="loading-state" *ngIf="loading"><div class="spinner"></div><p>Loading analytics...</p></div>

      <ng-container *ngIf="!loading && data">
        <div class="kpi-grid">
          <div class="kpi-card" *ngFor="let k of kpis">
            <div class="kpi-icon" [ngStyle]="{'background': k.bg}">{{ k.icon }}</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ k.value }}</div>
              <div class="kpi-label">{{ k.label }}</div>
            </div>
          </div>
        </div>

        <div class="charts-row">
          <div class="chart-card">
            <h3>Projects by Status</h3>
            <div class="bar-chart">
              <div class="bar-row" *ngFor="let s of data.projectsByStatus">
                <span class="bar-label">{{ formatStatus(s._id) }}</span>
                <div class="bar-track">
                  <div class="bar-fill status-{{ s._id }}-bar" [style.width.%]="getBarPct(s.count, data.totalProjects)"></div>
                </div>
                <span class="bar-count">{{ s.count }}</span>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <h3>Tasks by Status</h3>
            <div class="donut-grid">
              <div class="donut-item" *ngFor="let s of data.tasksByStatus">
                <div class="donut-circle" [ngClass]="'task-' + s._id">
                  <span>{{ s.count }}</span>
                </div>
                <div class="donut-label">{{ formatStatus(s._id) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="recent-projects">
          <h3>Recent Projects</h3>
          <div class="recent-table">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of data.recentProjects">
                  <td class="project-name">{{ p.title }}</td>
                  <td><span class="status-badge status-{{ p.status }}">{{ formatStatus(p.status) }}</span></td>
                  <td><span class="priority-badge priority-{{ p.priority }}">{{ p.priority }}</span></td>
                  <td>{{ p.createdAt | date:'mediumDate' }}</td>
                  <td><button class="btn-view" (click)="router.navigate(['/projects', p._id])">View</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
              </ng-container>
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
    
    .analytics-page { max-width: 1200px; margin: 0 auto; width: 100%; }
    .page-header { margin-bottom: 28px; }
    .page-header h1 { font-size: 28px; font-weight: 700; color: white; margin: 0; }
    .subtitle { color: #94a3b8; margin: 4px 0 0; font-size: 14px; }
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 80px; color: #94a3b8; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(30, 58, 138, 0.3); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .kpi-card { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 14px; padding: 22px; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
    .kpi-value { font-size: 28px; font-weight: 800; color: white; }
    .kpi-label { font-size: 13px; color: #94a3b8; }
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .chart-card { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 14px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .chart-card h3 { font-size: 16px; font-weight: 700; color: white; margin: 0 0 20px; }
    .bar-chart { display: flex; flex-direction: column; gap: 12px; }
    .bar-row { display: flex; align-items: center; gap: 10px; }
    .bar-label { font-size: 13px; color: #cbd5e1; width: 90px; text-transform: capitalize; flex-shrink: 0; }
    .bar-track { flex: 1; background: rgba(30, 58, 138, 0.3); border-radius: 99px; height: 10px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
    .status-planning-bar{background:#3b82f6}.status-active-bar{background:#22c55e}.status-on_hold-bar{background:#f59e0b}.status-completed-bar{background:#059669}.status-archived-bar{background:#94a3b8}
    .bar-count { font-size: 13px; font-weight: 700; color: #f8fafc; width: 24px; text-align: right; }
    .donut-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .donut-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .donut-circle { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #fff; }
    .task-todo{background:#94a3b8}.task-in_progress{background:#3b82f6}.task-in_review{background:#f59e0b}.task-done{background:#22c55e}.task-blocked{background:#ef4444}
    .donut-label { font-size: 11px; color: #94a3b8; text-align: center; text-transform: capitalize; }
    .recent-projects { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .recent-projects h3 { font-size: 16px; font-weight: 700; color: white; padding: 20px 24px; margin: 0; border-bottom: 1px solid rgba(30, 58, 138, 0.3); }
    .recent-table table { width: 100%; border-collapse: collapse; }
    thead { background: rgba(30, 58, 138, 0.1); }
    th { padding: 12px 20px; text-align: left; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
    td { padding: 14px 20px; border-bottom: 1px solid rgba(30, 58, 138, 0.3); font-size: 14px; color: #cbd5e1; }
    tr:last-child td { border-bottom: none; }
    .project-name { font-weight: 600; color: white; }
    .status-planning { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .status-active { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .status-on_hold { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .status-completed { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .status-archived { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
    .priority-low { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .priority-medium { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .priority-high { background: rgba(234, 88, 12, 0.2); color: #f97316; }
    .priority-critical { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .btn-view { background: rgba(30, 58, 138, 0.4); color: #60a5fa; border: none; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-view:hover { background: rgba(59, 130, 246, 0.3); }
  `]
})
export class ProjectAnalyticsComponent implements OnInit {
  data: any = null;
  loading = false;
  kpis: any[] = [];
  userRole = '';
  isAdmin = false;

  constructor(public router: Router, private projectService: ProjectService, private auth: AuthService) {}

  ngOnInit() {
    const user = this.auth.getUser();
    this.userRole = user?.role?.toLowerCase() || '';
    this.isAdmin = this.userRole === 'admin';
    this.loading = true;
    this.projectService.getAnalytics().subscribe({
      next: (d) => {
        this.data = d;
        this.kpis = [
          { icon: '📁', label: 'Total Projects', value: d.totalProjects, bg: 'rgba(59, 130, 246, 0.2)' },
          { icon: '✅', label: 'Total Tasks', value: d.totalTasks, bg: 'rgba(34, 197, 94, 0.2)' },
          { icon: '⚠️', label: 'Overdue Tasks', value: d.overdueTasks, bg: 'rgba(239, 68, 68, 0.2)' },
          { icon: '📊', label: 'Completion Rate', value: this.getCompletionRate(d) + '%', bg: 'rgba(34, 197, 94, 0.2)' }
        ];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getBarPct(count: number, total: number) { return total ? Math.round((count / total) * 100) : 0; }
  formatStatus(s: string) { return s?.replace('_', ' ') || ''; }
  getCompletionRate(d: any) {
    const done = d.tasksByStatus.find((s: any) => s._id === 'done')?.count || 0;
    return d.totalTasks ? Math.round((done / d.totalTasks) * 100) : 0;
  }
}
