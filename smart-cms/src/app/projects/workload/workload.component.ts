import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProjectService } from '../../services/project.service';
import { SharedSidebarComponent } from '../../dashboard/components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';
import { AdminSidebarComponent } from '../../admin/components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';

interface WorkloadMember {
  userId: string;
  name: string;
  taskCounts: { todo: number; in_progress: number; in_review: number; done: number; blocked: number; };
  weeklyLoggedHours: number;
}

@Component({
  selector: 'app-workload',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, SharedSidebarComponent, AdminSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] text-slate-800 light:text-[#0D1B35] dark:text-white font-sans overflow-hidden">
      <app-admin-sidebar *ngIf="isAdmin" class="flex-shrink-0"></app-admin-sidebar>
      <app-shared-sidebar *ngIf="!isAdmin" class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header title="Team Workload"></app-shared-header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935]">
          <div class="workload-page">

            <div class="page-header">
              <h1>Team Workload</h1>
              <p class="subtitle">Task distribution and weekly logged hours per member</p>
            </div>

            <div class="loading-state" *ngIf="loading">
              <div class="spinner"></div>
              <p>Loading workload data...</p>
            </div>

            <div class="empty-state" *ngIf="!loading && members.length === 0">
              <span class="empty-icon">👥</span>
              <p>No members found for this project</p>
            </div>

            <div class="member-grid" *ngIf="!loading && members.length > 0">
              <div class="member-card" *ngFor="let m of members">
                <div class="member-header">
                  <div class="avatar">{{ getInitials(m.name) }}</div>
                  <div class="member-info">
                    <div class="member-name">{{ m.name }}</div>
                    <div class="member-hours">
                      <span class="hours-icon">🕐</span>
                      {{ m.weeklyLoggedHours | number:'1.1-1' }}h this week
                    </div>
                  </div>
                </div>

                <div class="task-counts">
                  <div class="task-row" *ngFor="let s of getStatusRows(m)">
                    <span class="task-label">{{ s.label }}</span>
                    <div class="task-bar-track">
                      <div class="task-bar-fill {{ s.cls }}" [style.width.%]="getBarPct(s.count, getTotalTasks(m))"></div>
                    </div>
                    <span class="task-count">{{ s.count }}</span>
                  </div>
                </div>

                <div class="total-row">
                  <span class="total-label">Total Tasks</span>
                  <span class="total-value">{{ getTotalTasks(m) }}</span>
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

    .workload-page { max-width: 1200px; margin: 0 auto; width: 100%; }
    .page-header { margin-bottom: 28px; }
    .page-header h1 { font-size: 28px; font-weight: 700; color: white; margin: 0; }
    .subtitle { color: #94a3b8; margin: 4px 0 0; font-size: 14px; }

    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 80px; color: #94a3b8; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(30, 58, 138, 0.3); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px; color: #94a3b8; gap: 12px; }
    .empty-icon { font-size: 40px; }
    .empty-state p { margin: 0; font-size: 15px; }

    .member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }

    .member-card { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 14px; padding: 22px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 18px; }

    .member-header { display: flex; align-items: center; gap: 14px; }
    .avatar { width: 46px; height: 46px; border-radius: 50%; background: rgba(59, 130, 246, 0.25); color: #60a5fa; font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .member-name { font-size: 15px; font-weight: 700; color: white; }
    .member-hours { font-size: 12px; color: #94a3b8; margin-top: 3px; display: flex; align-items: center; gap: 4px; }
    .hours-icon { font-size: 12px; }

    .task-counts { display: flex; flex-direction: column; gap: 10px; }
    .task-row { display: flex; align-items: center; gap: 10px; }
    .task-label { font-size: 12px; color: #cbd5e1; width: 80px; flex-shrink: 0; text-transform: capitalize; }
    .task-bar-track { flex: 1; background: rgba(30, 58, 138, 0.3); border-radius: 99px; height: 8px; overflow: hidden; }
    .task-bar-fill { height: 100%; border-radius: 99px; transition: width 0.5s ease; min-width: 0; }
    .fill-todo { background: #94a3b8; }
    .fill-in_progress { background: #3b82f6; }
    .fill-in_review { background: #f59e0b; }
    .fill-done { background: #22c55e; }
    .fill-blocked { background: #ef4444; }
    .task-count { font-size: 12px; font-weight: 700; color: #f8fafc; width: 20px; text-align: right; flex-shrink: 0; }

    .total-row { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid rgba(30, 58, 138, 0.3); }
    .total-label { font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .total-value { font-size: 18px; font-weight: 800; color: white; }
  `]
})
export class WorkloadComponent implements OnInit {
  members: WorkloadMember[] = [];
  loading = false;
  isAdmin = false;

  private readonly statusRows = [
    { key: 'todo', label: 'To Do', cls: 'fill-todo' },
    { key: 'in_progress', label: 'In Progress', cls: 'fill-in_progress' },
    { key: 'in_review', label: 'In Review', cls: 'fill-in_review' },
    { key: 'done', label: 'Done', cls: 'fill-done' },
    { key: 'blocked', label: 'Blocked', cls: 'fill-blocked' },
  ];

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const user = this.auth.getUser();
    this.isAdmin = user?.role?.toLowerCase() === 'admin';
    const projectId = this.route.snapshot.paramMap.get('id');
    if (!projectId) return;
    this.loading = true;
    this.projectService.getWorkload(projectId).subscribe({
      next: (res) => {
        this.members = res?.members || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load workload data', 'Close', { duration: 4000 });
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getStatusRows(m: WorkloadMember) {
    return this.statusRows.map(s => ({
      label: s.label,
      cls: s.cls,
      count: m.taskCounts[s.key as keyof typeof m.taskCounts] || 0
    }));
  }

  getTotalTasks(m: WorkloadMember): number {
    const c = m.taskCounts;
    return c.todo + c.in_progress + c.in_review + c.done + c.blocked;
  }

  getBarPct(count: number, total: number): number {
    return total ? Math.round((count / total) * 100) : 0;
  }
}
