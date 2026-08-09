import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProjectService } from '../../services/project.service';
import { SharedSidebarComponent } from '../../dashboard/components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';
import { AdminSidebarComponent } from '../../admin/components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-project-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, SharedSidebarComponent, AdminSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] text-slate-800 light:text-[#0D1B35] dark:text-white font-sans overflow-hidden">
      <app-admin-sidebar *ngIf="isAdmin" class="flex-shrink-0"></app-admin-sidebar>
      <app-shared-sidebar *ngIf="!isAdmin" class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header title="Project Analytics"></app-shared-header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935]">
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
                  <h3>Project Status Distribution</h3>
                  <div class="bar-chart">
                    <div class="bar-row" *ngFor="let s of data.projectsByStatus">
                      <span class="bar-label">{{ formatStatus(s._id) }}</span>
                      <div class="bar-track">
                        <div class="bar-fill status-{{ s._id }}-bar" [style.width.%]="getBarPct(s.count, data.totalProjects)"></div>
                      </div>
                      <span class="bar-count">{{ s.count }}</span>
                    </div>
                    <div class="bar-empty" *ngIf="!data.projectsByStatus?.length">No project data available</div>
                  </div>
                </div>

                <div class="chart-card">
                  <h3>Task Status Distribution</h3>
                  <div class="bar-chart">
                    <div class="bar-row" *ngFor="let s of data.tasksByStatus">
                      <span class="bar-label">{{ formatStatus(s._id) }}</span>
                      <div class="bar-track">
                        <div class="bar-fill task-bar-{{ s._id }}" [style.width.%]="getBarPct(s.count, data.totalTasks)"></div>
                      </div>
                      <span class="bar-count">{{ s.count }}</span>
                    </div>
                    <div class="bar-empty" *ngIf="!data.tasksByStatus?.length">No task data available</div>
                  </div>
                </div>
              </div>

              <div class="overdue-section">
                <div class="overdue-card">
                  <div class="overdue-icon">⚠️</div>
                  <div class="overdue-body">
                    <div class="overdue-count">{{ data.overdueTasks }}</div>
                    <div class="overdue-label">Overdue Tasks</div>
                    <div class="overdue-sub">Tasks past their due date and not yet completed</div>
                  </div>
                  <div class="overdue-bar-wrap">
                    <div class="overdue-bar-track">
                      <div class="overdue-bar-fill" [style.width.%]="getBarPct(data.overdueTasks, data.totalTasks)"></div>
                    </div>
                    <span class="overdue-pct">{{ getBarPct(data.overdueTasks, data.totalTasks) }}% of total tasks</span>
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

            <div class="utilization-section">
              <div class="utilization-header">
                <h2>Team Utilization</h2>
                <div class="utilization-controls">
                  <div class="control-group">
                    <label>Project</label>
                    <select [(ngModel)]="selectedProjectId" (ngModelChange)="onProjectChange($event)" class="ctrl-select">
                      <option value="">Select a project</option>
                      <option *ngFor="let p of projects" [value]="p._id">{{ p.title }}</option>
                    </select>
                  </div>
                  <div class="control-group">
                    <label>From</label>
                    <input type="date" [(ngModel)]="startDate" (ngModelChange)="onDateChange()" class="ctrl-input" />
                  </div>
                  <div class="control-group">
                    <label>To</label>
                    <input type="date" [(ngModel)]="endDate" (ngModelChange)="onDateChange()" class="ctrl-input" />
                  </div>
                </div>
              </div>

              <div class="utilization-body">
                <div class="loading-state" *ngIf="workloadLoading">
                  <div class="spinner"></div>
                  <p>Loading utilization data...</p>
                </div>

                <div class="empty-state" *ngIf="!workloadLoading && !selectedProjectId">
                  <span class="empty-icon">📊</span>
                  <p>Select a project to view team utilization</p>
                </div>

                <div class="empty-state" *ngIf="!workloadLoading && selectedProjectId && utilizationData.length === 0">
                  <span class="empty-icon">👥</span>
                  <p>No team members found for this project</p>
                </div>

                <div class="utilization-chart" *ngIf="!workloadLoading && utilizationData.length > 0">
                  <div class="util-row" *ngFor="let m of utilizationData">
                    <div class="util-name">{{ m.name }}</div>
                    <div class="util-bar-wrap">
                      <div class="util-bar-track">
                        <div
                          class="util-bar-fill"
                          [ngClass]="getUtilColor(m.utilizationRate)"
                          [style.width.%]="m.utilizationRate">
                        </div>
                      </div>
                      <span class="util-pct">{{ m.utilizationRate | number:'1.0-0' }}%</span>
                    </div>
                  </div>
                  <div class="util-legend">
                    <span class="legend-item"><span class="legend-dot green"></span>Under 70%</span>
                    <span class="legend-item"><span class="legend-dot yellow"></span>70–89%</span>
                    <span class="legend-item"><span class="legend-dot red"></span>90%+</span>
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

    .analytics-page { max-width: 1200px; margin: 0 auto; width: 100%; }
    .page-header { margin-bottom: 28px; }
    .page-header h1 { font-size: 28px; font-weight: 700; color: white; margin: 0; }
    .subtitle { color: #94a3b8; margin: 4px 0 0; font-size: 14px; }
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 80px; color: #94a3b8; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(30, 58, 138, 0.3); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .kpi-card { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 14px; padding: 22px; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06); }
    .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
    .kpi-value { font-size: 28px; font-weight: 800; color: white; }
    .kpi-label { font-size: 13px; color: #94a3b8; }
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .chart-card { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 14px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06); }
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
    .bar-empty { font-size: 13px; color: #64748b; text-align: center; padding: 16px 0; }
    .task-bar-todo{background:#94a3b8}.task-bar-in_progress{background:#3b82f6}.task-bar-in_review{background:#f59e0b}.task-bar-done{background:#22c55e}.task-bar-blocked{background:#ef4444}
    .overdue-section { margin-bottom: 28px; }
    .overdue-card { background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 14px; padding: 24px; display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    .overdue-icon { font-size: 40px; flex-shrink: 0; }
    .overdue-body { flex: 0 0 auto; }
    .overdue-count { font-size: 48px; font-weight: 900; color: #f87171; line-height: 1; }
    .overdue-label { font-size: 16px; font-weight: 700; color: #fca5a5; margin-top: 4px; }
    .overdue-sub { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .overdue-bar-wrap { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 8px; }
    .overdue-bar-track { width: 100%; background: rgba(239, 68, 68, 0.15); border-radius: 99px; height: 12px; overflow: hidden; }
    .overdue-bar-fill { height: 100%; background: #ef4444; border-radius: 99px; transition: width 0.6s ease; min-width: 2px; }
    .overdue-pct { font-size: 13px; color: #fca5a5; font-weight: 600; }
    .recent-projects { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06); margin-bottom: 28px; }
    .recent-projects h3 { font-size: 16px; font-weight: 700; color: white; padding: 20px 24px; margin: 0; border-bottom: 1px solid rgba(30, 58, 138, 0.3); }
    .recent-table table { width: 100%; border-collapse: collapse; }
    thead { background: rgba(30, 58, 138, 0.1); }
    th { padding: 12px 20px; text-align: left; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
    td { padding: 14px 20px; border-bottom: 1px solid rgba(30, 58, 138, 0.3); font-size: 14px; color: #cbd5e1; }
    tr:last-child td { border-bottom: none; }
    .project-name { font-weight: 600; color: white; }
    .status-planning{background:rgba(59,130,246,0.2);color:#60a5fa}.status-active{background:rgba(34,197,94,0.2);color:#4ade80}.status-on_hold{background:rgba(245,158,11,0.2);color:#fbbf24}.status-completed{background:rgba(16,185,129,0.2);color:#34d399}.status-archived{background:rgba(148,163,184,0.2);color:#94a3b8}
    .priority-low{background:rgba(34,197,94,0.2);color:#4ade80}.priority-medium{background:rgba(245,158,11,0.2);color:#fbbf24}.priority-high{background:rgba(234,88,12,0.2);color:#f97316}.priority-critical{background:rgba(239,68,68,0.2);color:#f87171}
    .btn-view { background: rgba(30, 58, 138, 0.4); color: #60a5fa; border: none; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-view:hover { background: rgba(59, 130, 246, 0.3); }

    .utilization-section { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06); }
    .utilization-header { padding: 20px 24px; border-bottom: 1px solid rgba(30, 58, 138, 0.3); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
    .utilization-header h2 { font-size: 16px; font-weight: 700; color: white; margin: 0; }
    .utilization-controls { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
    .control-group { display: flex; flex-direction: column; gap: 4px; }
    .control-group label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
    .ctrl-select, .ctrl-input { background: rgba(30, 58, 138, 0.3); border: 1px solid rgba(30, 58, 138, 0.5); border-radius: 8px; color: #f1f5f9; padding: 7px 12px; font-size: 13px; outline: none; }
    .ctrl-select { min-width: 180px; }
    .ctrl-select:focus, .ctrl-input:focus { border-color: #3b82f6; }
    .ctrl-input { color-scheme: dark; }
    .utilization-body { padding: 24px; min-height: 120px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; color: #94a3b8; gap: 10px; }
    .empty-icon { font-size: 36px; }
    .empty-state p { margin: 0; font-size: 14px; }
    .utilization-chart { display: flex; flex-direction: column; gap: 16px; }
    .util-row { display: flex; align-items: center; gap: 12px; }
    .util-name { font-size: 13px; color: #cbd5e1; width: 140px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .util-bar-wrap { flex: 1; display: flex; align-items: center; gap: 10px; }
    .util-bar-track { flex: 1; background: rgba(30, 58, 138, 0.3); border-radius: 99px; height: 12px; overflow: hidden; }
    .util-bar-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; min-width: 2px; }
    .util-bar-fill.green { background: #22c55e; }
    .util-bar-fill.yellow { background: #f59e0b; }
    .util-bar-fill.red { background: #ef4444; }
    .util-pct { font-size: 13px; font-weight: 700; color: #f8fafc; width: 42px; text-align: right; flex-shrink: 0; }
    .util-legend { display: flex; gap: 20px; margin-top: 8px; padding-top: 16px; border-top: 1px solid rgba(30, 58, 138, 0.3); }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #94a3b8; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-dot.green { background: #22c55e; }
    .legend-dot.yellow { background: #f59e0b; }
    .legend-dot.red { background: #ef4444; }
  `]
})
export class ProjectAnalyticsComponent implements OnInit {
  data: any = null;
  loading = false;
  kpis: any[] = [];
  userRole = '';
  isAdmin = false;

  projects: any[] = [];
  selectedProjectId = '';
  startDate = '';
  endDate = '';
  workloadLoading = false;
  utilizationData: { name: string; utilizationRate: number }[] = [];

  constructor(
    public router: Router,
    private projectService: ProjectService,
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

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
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load analytics data', 'Close', { duration: 4000 });
      }
    });
    this.projectService.getAll().subscribe({
      next: (list) => { this.projects = list; },
      error: () => {}
    });
  }

  onProjectChange(projectId: string) {
    if (!projectId) {
      this.utilizationData = [];
      return;
    }
    this.fetchWorkload(projectId);
  }

  onDateChange() {
    if (this.selectedProjectId) {
      this.fetchWorkload(this.selectedProjectId);
    }
  }

  private fetchWorkload(projectId: string) {
    this.workloadLoading = true;
    this.utilizationData = [];
    this.projectService.getWorkload(projectId).subscribe({
      next: (res) => {
        const members: any[] = res?.members || [];
        this.utilizationData = members.map((m) => ({
          name: m.name,
          utilizationRate: Math.min(100, (m.weeklyLoggedHours / 40) * 100)
        }));
        this.workloadLoading = false;
      },
      error: () => {
        this.workloadLoading = false;
        this.snackBar.open('Failed to load workload data', 'Close', { duration: 3000 });
      }
    });
  }

  getUtilColor(rate: number): string {
    if (rate >= 90) return 'red';
    if (rate >= 70) return 'yellow';
    return 'green';
  }

  getBarPct(count: number, total: number) { return total ? Math.round((count / total) * 100) : 0; }
  formatStatus(s: string) { return s?.replace('_', ' ') || ''; }
  getCompletionRate(d: any) {
    const done = d.tasksByStatus.find((s: any) => s._id === 'done')?.count || 0;
    return d.totalTasks ? Math.round((done / d.totalTasks) * 100) : 0;
  }
}
