import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { SharedSidebarComponent } from '../../dashboard/components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';
import { AdminSidebarComponent } from '../../admin/components/sidebar/sidebar.component';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedSidebarComponent, AdminSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-[#101935] text-white font-sans overflow-hidden">
      <app-admin-sidebar *ngIf="isAdmin" class="flex-shrink-0"></app-admin-sidebar>
      <app-shared-sidebar *ngIf="!isAdmin" class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header title="My Tasks"></app-shared-header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar bg-[#101935]">
          <div class="my-tasks-page">
            <div class="page-header">
        <div>
          <h1>My Tasks</h1>
          <p class="subtitle">All tasks assigned to you across all projects</p>
        </div>
      </div>

      <div class="summary-cards">
        <div class="summary-card" *ngFor="let s of summaryItems" [ngStyle]="{'border-color': s.color + '33'}">
          <div class="card-icon" [ngStyle]="{'background': s.bg}">{{ s.icon }}</div>
          <div>
            <div class="card-count" [ngStyle]="{'color': s.color}">{{ s.count }}</div>
            <div class="card-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="filters-bar">
        <select [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>
        <select [(ngModel)]="filterPriority" (ngModelChange)="applyFilters()">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <label class="toggle-label">
          <input type="checkbox" [(ngModel)]="showOverdueOnly" (ngModelChange)="applyFilters()"> Overdue only
        </label>
      </div>

      <div class="loading-state" *ngIf="loading"><div class="spinner"></div><p>Loading tasks...</p></div>

      <div class="tasks-table" *ngIf="!loading">
        <div class="empty-state" *ngIf="filtered.length === 0">
          <div class="empty-icon">✅</div>
          <h3>No tasks found</h3>
          <p>You have no tasks matching the current filters.</p>
        </div>
        <table *ngIf="filtered.length > 0">
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Progress</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of filtered" [class.overdue-row]="t.isOverdue">
              <td class="task-name-cell">
                <p class="task-name">{{ t.title }}</p>
                <p class="task-project-name" *ngIf="t.project">{{ t.project.title }}</p>
                <span class="overdue-badge" *ngIf="t.isOverdue">Overdue</span>
              </td>
              <td><span class="project-chip">{{ t.project?.title || '—' }}</span></td>
              <td><span class="priority-badge priority-{{ t.priority }}">{{ t.priority }}</span></td>
              <td><span class="status-badge status-{{ t.status }}">{{ formatStatus(t.status) }}</span></td>
              <td>
                <span [class.overdue-text]="t.isOverdue">{{ t.dueDate ? (t.dueDate | date:'MMM d') : '—' }}</span>
                <span class="late-badge" *ngIf="t.isOverdue"> Late</span>
              </td>
              <td>
                <div class="mini-progress">
                  <div class="mini-bar" [style.width.%]="getTimePct(t)"></div>
                </div>
                <span class="mini-label">{{ t.loggedHours || 0 }}/{{ t.estimatedHours || 0 }}h</span>
              </td>
              <td>
                <select class="status-select" [ngModel]="t.status" (ngModelChange)="changeStatus(t, $event)">
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
                <button class="btn-detail" (click)="router.navigate(['/tasks', t._id])">View</button>
              </td>
            </tr>
          </tbody>
        </table>
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
    
    .my-tasks-page { max-width: 1200px; margin: 0 auto; width: 100%; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 28px; font-weight: 700; color: white; margin: 0; }
    .subtitle { color: #94a3b8; margin: 4px 0 0; font-size: 14px; }
    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .summary-card { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 12px; padding: 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .card-count { font-size: 22px; font-weight: 700; color: white; }
    .card-label { font-size: 12px; color: #94a3b8; }
    .filters-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
    select { padding: 9px 14px; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 8px; font-size: 14px; background: #1B264F; color: white; cursor: pointer; outline: none; }
    .toggle-label { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #cbd5e1; cursor: pointer; }
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #94a3b8; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(30, 58, 138, 0.3); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .tasks-table { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    table { width: 100%; border-collapse: collapse; }
    thead { background: rgba(30, 58, 138, 0.1); }
    th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(30, 58, 138, 0.3); }
    td { padding: 12px 16px; border-bottom: 1px solid rgba(30, 58, 138, 0.2); font-size: 14px; color: #cbd5e1; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr.overdue-row { background: rgba(239, 68, 68, 0.05); border-left: 4px solid #ef4444; }
    .overdue-badge { display: inline-block; background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; margin-top: 3px; border: 1px solid rgba(239, 68, 68, 0.4); }
    .task-name { font-weight: 600; color: white; margin: 0; }
    .task-project-name { font-size: 12px; color: #94a3b8; margin: 2px 0 0; }
    .project-chip { background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 500; }
    .priority-badge,.status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; text-transform: capitalize; }
    .status-planning { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .status-active { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .status-on_hold { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .status-completed { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .status-archived { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
    .priority-low { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .priority-medium { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .priority-high { background: rgba(234, 88, 12, 0.2); color: #f97316; }
    .priority-critical { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .status-todo{background:rgba(148, 163, 184, 0.2);color:#94a3b8}.status-in_progress{background:rgba(59, 130, 246, 0.2);color:#60a5fa}.status-in_review{background:rgba(245, 158, 11, 0.2);color:#fbbf24}.status-done{background:rgba(34, 197, 94, 0.2);color:#4ade80}.status-blocked{background:rgba(239, 68, 68, 0.2);color:#f87171}
    .overdue-text { color: #f87171; font-weight: 600; }
    .late-badge { background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; }
    .mini-progress { background: rgba(30, 58, 138, 0.3); border-radius: 99px; height: 4px; width: 80px; overflow: hidden; margin-bottom: 3px; }
    .mini-bar { background: linear-gradient(90deg,#3b82f6,#6366f1); height: 100%; border-radius: 99px; }
    .mini-label { font-size: 11px; color: #94a3b8; }
    .status-select { padding: 5px 8px; border: 1px solid rgba(30, 58, 138, 0.3); background: #1B264F; color: white; border-radius: 7px; font-size: 12px; cursor: pointer; margin-right: 6px; }
    .btn-detail { background: rgba(30, 58, 138, 0.4); color: #60a5fa; border: none; padding: 5px 12px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn-detail:hover { background: rgba(59, 130, 246, 0.3); }
    .empty-state { text-align: center; padding: 60px; color: #94a3b8; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.8; }
    .empty-state h3 { color: white; }
  `]
})
export class MyTasksComponent implements OnInit {
  allTasks: any[] = [];
  filtered: any[] = [];
  loading = false;
  filterStatus = '';
  filterPriority = '';
  showOverdueOnly = false;
  summaryItems: any[] = [];
  userRole: string = '';
  isAdmin: boolean = false;

  constructor(public router: Router, private taskService: TaskService, private auth: AuthService) {}

  ngOnInit() { 
    const user = this.auth.getUser();
    this.userRole = user?.role?.toLowerCase() || '';
    this.isAdmin = this.userRole === 'admin';
    this.load(); 
  }

  load() {
    this.loading = true;
    this.taskService.getMyTasks().subscribe({
      next: (data) => {
        this.allTasks = data;
        this.buildSummary();
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  buildSummary() {
    const counts = { total: this.allTasks.length, inProgress: 0, done: 0, overdue: 0 };
    this.allTasks.forEach(t => {
      if (t.status === 'in_progress') counts.inProgress++;
      if (t.status === 'done') counts.done++;
      if (t.isOverdue) counts.overdue++;
    });
    this.summaryItems = [
      { icon: '📋', label: 'Total Tasks', count: counts.total, bg: 'rgba(59, 130, 246, 0.25)', color: '#60a5fa' },
      { icon: '🔄', label: 'In Progress', count: counts.inProgress, bg: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24' },
      { icon: '✅', label: 'Completed', count: counts.done, bg: 'rgba(34, 197, 94, 0.25)', color: '#4ade80' },
      { icon: '⚠️', label: 'Overdue', count: counts.overdue, bg: 'rgba(239, 68, 68, 0.25)', color: '#f87171' }
    ];
  }

  applyFilters() {
    this.filtered = this.allTasks.filter(t => {
      if (this.filterStatus && t.status !== this.filterStatus) return false;
      if (this.filterPriority && t.priority !== this.filterPriority) return false;
      if (this.showOverdueOnly && !t.isOverdue) return false;
      return true;
    });
  }

  isOverdue(t: any) { return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'; }
  formatStatus(s: string) { return s?.replace('_', ' ') || ''; }
  getTimePct(t: any) { return t.estimatedHours ? Math.min(100, Math.round((t.loggedHours / t.estimatedHours) * 100)) : 0; }

  changeStatus(task: any, status: string) {
    this.taskService.updateStatus(task._id, status).subscribe({
      next: () => { task.status = status; this.buildSummary(); this.applyFilters(); }
    });
  }
}
