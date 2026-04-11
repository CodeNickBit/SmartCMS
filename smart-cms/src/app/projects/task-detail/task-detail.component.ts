import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';

import { SharedSidebarComponent } from '../../dashboard/components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';
import { AdminSidebarComponent } from '../../admin/components/sidebar/sidebar.component';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, RouterModule, SharedSidebarComponent, AdminSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-[#101935] text-white font-sans overflow-hidden">
      <app-admin-sidebar *ngIf="isAdmin" class="flex-shrink-0"></app-admin-sidebar>
      <app-shared-sidebar *ngIf="!isAdmin" class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header title="Task Details"></app-shared-header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar bg-[#101935]">
          <div class="task-detail-page" *ngIf="task">
            <div class="page-header">
        <button class="btn-back" (click)="router.navigate(['/projects', task.projectId?.toString ? task.projectId.toString() : task.projectId])">← Back to Project</button>
        <div class="status-select">
          <label>Status</label>
          <select [ngModel]="task.status" (ngModelChange)="updateStatus($event)" [disabled]="!canUpdate">
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      <div class="task-content">
        <div class="task-main">
          <div class="task-hero">
            <div class="badge-row">
              <span class="priority-badge priority-{{ task.priority }}">{{ task.priority }}</span>
              <span class="status-badge status-{{ task.status }}">{{ formatStatus(task.status) }}</span>
              <span class="overdue-badge" *ngIf="isOverdue">⚠️ Overdue</span>
            </div>
            <h1>{{ task.title }}</h1>
            <p class="task-desc" *ngIf="task.description">{{ task.description }}</p>
          </div>

          <div class="comments-section">
            <h3>Comments ({{ task.comments?.length || 0 }})</h3>
            <div class="comment-list">
              <div class="comment" *ngFor="let c of task.comments">
                <div class="comment-header">
                  <span class="comment-author">{{ c.authorName }}</span>
                  <span class="comment-role">{{ c.authorRole }}</span>
                  <span class="comment-time">{{ c.createdAt | date:'MMM d, h:mm a' }}</span>
                </div>
                <p class="comment-text">{{ c.text }}</p>
              </div>
              <div class="no-comments" *ngIf="!task.comments?.length">No comments yet. Be the first to comment.</div>
            </div>
            <div class="add-comment">
              <textarea [(ngModel)]="commentText" rows="2" placeholder="Write a comment..."></textarea>
              <button class="btn-primary btn-post" (click)="addComment()" [disabled]="!commentText.trim()">Post</button>
            </div>
          </div>
        </div>

        <div class="task-sidebar">
          <div class="sidebar-card">
            <h4>Details</h4>
            <div class="detail-row">
              <span class="label">Assigned To</span>
              <div class="assignee-select" *ngIf="canManage; else showAssignee">
                <select [ngModel]="task.assignedTo" (ngModelChange)="updateAssignee($event)">
                  <option value="">Unassigned</option>
                  <option *ngFor="let m of projectMembers" [value]="m.userId">{{ m.name || m.email }}</option>
                </select>
              </div>
              <ng-template #showAssignee>
                <span class="value">{{ task.assignedToName || 'Unassigned' }}</span>
              </ng-template>
            </div>
            <div class="detail-row"><span class="label">Assigned By</span><span>{{ task.assignedByName || '—' }}</span></div>
            <div class="detail-row"><span class="label">Due Date</span><span [class.overdue-text]="isOverdue">{{ task.dueDate ? (task.dueDate | date:'mediumDate') : '—' }}</span></div>
            <div class="detail-row"><span class="label">Estimated</span><span>{{ task.estimatedHours || 0 }}h</span></div>
            <div class="detail-row"><span class="label">Logged</span><span>{{ task.loggedHours || 0 }}h</span></div>
            <div class="time-progress" *ngIf="task.estimatedHours">
              <div class="progress-bar-bg"><div class="progress-bar-fill" [style.width.%]="getTimePct()"></div></div>
              <span class="progress-label">{{ getTimePct() }}% of {{ task.estimatedHours }}h used</span>
            </div>
          </div>

          <div class="sidebar-card" *ngIf="canUpdate">
            <h4>Log Time</h4>
            <div class="form-group">
              <label>Hours <span class="hint">(0.25 – 24)</span></label>
              <input type="number" [(ngModel)]="timeLog.hours" min="0.25" max="24" step="0.25" placeholder="0.5" [class.input-error]="hoursError">
              <span class="error-msg" *ngIf="hoursError">{{ hoursError }}</span>
            </div>
            <div class="form-group">
              <label>Date</label>
              <input type="date" [(ngModel)]="timeLog.date">
            </div>
            <div class="form-group">
              <label>Description</label>
              <input [(ngModel)]="timeLog.description" placeholder="What did you work on?">
            </div>
            <button class="btn-primary full-width" (click)="logTime()" [disabled]="submittingLog || !timeLog.hours">
              {{ submittingLog ? 'Logging...' : 'Log Time' }}
            </button>
          </div>

          <div class="sidebar-card">
            <h4>Time Logs ({{ timeLogs?.length || 0 }})</h4>
            <div *ngIf="loadingLogs" class="logs-loading"><div class="spinner-sm"></div></div>
            <ng-container *ngIf="!loadingLogs">
              <div class="time-entry" *ngFor="let l of timeLogs">
                <div class="time-entry-row">
                  <span class="log-name">{{ l.employeeName }}</span>
                  <span class="log-hours">{{ l.hours }}h</span>
                </div>
                <div class="log-meta">{{ l.date | date:'MMM d, yyyy' }}<span *ngIf="l.description"> · {{ l.description }}</span></div>
              </div>
              <div class="no-logs" *ngIf="!timeLogs?.length">No time logged yet.</div>
            </ng-container>
          </div>

          <div class="sidebar-card">
            <h4>Subtasks ({{ subtasks?.length || 0 }})</h4>
            <div *ngIf="loadingSubtasks" class="logs-loading"><div class="spinner-sm"></div></div>
            <ng-container *ngIf="!loadingSubtasks">
              <div class="subtask-entry" *ngFor="let s of subtasks" [routerLink]="['/tasks', s._id]">
                <div class="subtask-row">
                  <span class="subtask-title">{{ s.title }}</span>
                  <span class="priority-badge priority-{{ s.priority }}">{{ s.priority }}</span>
                </div>
                <div class="subtask-meta">
                  <span class="status-badge status-{{ s.status }}">{{ formatStatus(s.status) }}</span>
                  <span class="subtask-assignee" *ngIf="s.assignedToName">· {{ s.assignedToName }}</span>
                </div>
              </div>
              <div class="no-logs" *ngIf="!subtasks?.length">No subtasks yet.</div>
            </ng-container>
          </div>

          <div class="sidebar-card">
            <h4>Activity</h4>
            <div class="activity-entry" *ngFor="let a of (task.activityLog || []).slice().reverse()">
              <span class="act-dot"></span>
              <div>
                <p class="act-action">{{ a.action }}</p>
                <p class="act-meta">{{ a.performedByName }} · {{ a.at | date:'MMM d, h:mm a' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-state" *ngIf="!task && loading"><div class="spinner"></div><p>Loading task...</p></div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #1B264F; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3083DC; }

    .task-detail-page { max-width: 1200px; margin: 0 auto; width: 100%; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .btn-back { background: none; border: 1px solid rgba(30, 58, 138, 0.3); padding: 8px 16px; border-radius: 8px; cursor: pointer; color: #94a3b8; font-size: 14px; transition: all 0.2s; }
    .btn-back:hover { background: rgba(30, 58, 138, 0.2); color: white; }
    .status-select { display: flex; align-items: center; gap: 10px; }
    .status-select label { font-size: 13px; font-weight: 600; color: #cbd5e1; }
    .status-select select { padding: 8px 14px; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 8px; font-size: 14px; cursor: pointer; outline: none; background: #1B264F; color: white; }
    .status-select select:focus { border-color: #3b82f6; }
    .task-content { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
    .task-hero { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 14px; padding: 28px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .badge-row { display: flex; gap: 8px; margin-bottom: 14px; }
    .priority-badge,.status-badge,.overdue-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; text-transform: capitalize; }
    .priority-low{background:rgba(34, 197, 94, 0.2);color:#4ade80}.priority-medium{background:rgba(245, 158, 11, 0.2);color:#fbbf24}.priority-high{background:rgba(234, 88, 12, 0.2);color:#f97316}.priority-critical{background:rgba(239, 68, 68, 0.2);color:#f87171}
    .status-todo{background:rgba(148, 163, 184, 0.2);color:#94a3b8}.status-in_progress{background:rgba(59, 130, 246, 0.2);color:#60a5fa}.status-in_review{background:rgba(245, 158, 11, 0.2);color:#fbbf24}.status-done{background:rgba(34, 197, 94, 0.2);color:#4ade80}.status-blocked{background:rgba(239, 68, 68, 0.2);color:#f87171}
    .overdue-badge { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    h1 { font-size: 24px; font-weight: 700; color: white; margin: 0 0 8px; }
    .task-desc { color: #94a3b8; margin: 0; line-height: 1.6; font-size: 14px; }
    .comments-section { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 14px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .comments-section h3 { margin: 0 0 16px; font-size: 16px; font-weight: 700; color: white; }
    .comment { border-bottom: 1px solid rgba(30, 58, 138, 0.3); padding-bottom: 14px; margin-bottom: 14px; }
    .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .comment-author { font-weight: 600; font-size: 14px; color: white; }
    .comment-role { background: rgba(30, 58, 138, 0.3); color: #60a5fa; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .comment-time { font-size: 12px; color: #64748b; margin-left: auto; }
    .comment-text { margin: 0; font-size: 14px; color: #cbd5e1; line-height: 1.5; }
    .no-comments { text-align: center; color: #64748b; font-size: 14px; padding: 20px; }
    .add-comment { display: flex; gap: 12px; margin-top: 20px; align-items: flex-start; width: 100%; }
    .add-comment textarea { flex: 1; min-width: 0; padding: 12px 16px; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 10px; font-size: 14px; outline: none; resize: none; font-family: inherit; background: #101935; color: white; transition: all 0.2s; min-height: 44px; box-sizing: border-box; }
    .add-comment textarea:focus { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
    .add-comment .btn-post { flex-shrink: 0; width: 90px; }
    .btn-primary { background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; border: none; padding: 10px 24px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; white-space: nowrap; height: 44px; align-self: flex-start; }
    .btn-primary:hover:not(:disabled) { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary.full-width { width: 100%; }
    .sidebar-card { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 14px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .sidebar-card h4 { margin: 0 0 14px; font-size: 14px; font-weight: 700; color: white; border-bottom: 1px solid rgba(30, 58, 138, 0.3); padding-bottom: 10px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 12px; color: #cbd5e1; }
    .label { color: #64748b; font-weight: 500; }
    .value { font-weight: 500; }
    .assignee-select select { background: #101935; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 4px; color: white; padding: 2px 4px; font-size: 12px; outline: none; }
    .overdue-text { color: #f87171; font-weight: 600; }
    .time-progress { margin-top: 10px; }
    .progress-bar-bg { background: rgba(30, 58, 138, 0.3); border-radius: 99px; height: 6px; overflow: hidden; margin-bottom: 4px; }
    .progress-bar-fill { background: linear-gradient(90deg, #3b82f6, #6366f1); height: 100%; border-radius: 99px; }
    .progress-label { font-size: 11px; color: #64748b; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .form-group label { font-size: 12px; font-weight: 600; color: #cbd5e1; }
    .form-group input { padding: 8px 12px; border: 1px solid rgba(30, 58, 138, 0.3); background: #101935; color: white; border-radius: 8px; font-size: 13px; outline: none; transition: border-color 0.2s; }
    .form-group input:focus { border-color: #3b82f6; }
    .time-entry { border-bottom: 1px solid rgba(30, 58, 138, 0.3); padding: 10px 0; }
    .time-entry:last-child { border-bottom: none; }
    .time-entry-row { display: flex; justify-content: space-between; }
    .log-name { font-size: 13px; font-weight: 600; color: white; }
    .log-hours { font-size: 13px; color: #60a5fa; font-weight: 700; }
    .log-meta { font-size: 12px; color: #64748b; margin-top: 4px; }
    .activity-entry { display: flex; gap: 10px; margin-bottom: 14px; }
    .activity-entry:last-child { margin-bottom: 0; }
    .act-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; margin-top: 5px; flex-shrink: 0; }
    .act-action { font-size: 13px; color: #e2e8f0; margin: 0 0 2px; }
    .act-meta { font-size: 11px; color: #64748b; margin: 0; }
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #94a3b8; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(30, 58, 138, 0.3); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
    .spinner-sm { width: 20px; height: 20px; border: 2px solid rgba(30, 58, 138, 0.3); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 8px auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .hint { font-size: 11px; color: #64748b; font-weight: 400; }
    .input-error { border-color: #f87171 !important; }
    .error-msg { font-size: 11px; color: #f87171; margin-top: 2px; }
    .no-logs { text-align: center; color: #64748b; font-size: 13px; padding: 12px 0; }
    .logs-loading { display: flex; justify-content: center; padding: 8px 0; }
    .subtask-entry { border-bottom: 1px solid rgba(30, 58, 138, 0.3); padding: 10px 0; cursor: pointer; transition: background 0.15s; border-radius: 6px; padding-left: 4px; }
    .subtask-entry:last-child { border-bottom: none; }
    .subtask-entry:hover { background: rgba(59, 130, 246, 0.07); }
    .subtask-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; }
    .subtask-title { font-size: 13px; font-weight: 600; color: white; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .subtask-meta { display: flex; align-items: center; gap: 6px; }
    .subtask-assignee { font-size: 12px; color: #64748b; }
  `]
})
export class TaskDetailComponent implements OnInit {
  task: any = null;
  timeLogs: any[] = [];
  subtasks: any[] = [];
  loading = true;
  loadingLogs = false;
  loadingSubtasks = false;
  submittingLog = false;
  canUpdate = false;
  commentText = '';
  timeLog: any = { hours: null, date: '', description: '' };
  hoursError = '';
  currentUser: any;
  userRole: string = '';
  isAdmin: boolean = false;
  canManage: boolean = false;
  projectMembers: any[] = [];

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private taskService: TaskService,
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.currentUser = this.auth.getUser();
    this.userRole = this.currentUser?.role?.toLowerCase() || '';
    this.isAdmin = this.userRole === 'admin';
    const id = this.route.snapshot.paramMap.get('id')!;
    this.taskService.getById(id).subscribe({
      next: (data: any) => {
        this.task = data.task;
        this.projectMembers = data.projectMembers || [];
        this.loading = false;

        const uid = String(this.currentUser?._id || this.currentUser?.id);
        const role = this.userRole;
        this.canUpdate = role === 'admin' || role === 'manager' || this.task.assignedTo === uid;
        this.canManage = role === 'admin' || role === 'manager';

        this.fetchTimeLogs(id);
        this.fetchSubtasks(id);
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load task details', 'Close', { duration: 3000 });
      }
    });
  }

  fetchTimeLogs(taskId: string) {
    this.loadingLogs = true;
    this.taskService.getTimeLogs(taskId).subscribe({
      next: (logs: any) => {
        this.timeLogs = Array.isArray(logs) ? logs : (logs?.timeLogs || []);
        this.loadingLogs = false;
      },
      error: () => { this.loadingLogs = false; }
    });
  }

  fetchSubtasks(taskId: string) {
    this.loadingSubtasks = true;
    this.taskService.getSubtasks(taskId).subscribe({
      next: (data: any) => {
        this.subtasks = Array.isArray(data) ? data : (data?.subtasks || []);
        this.loadingSubtasks = false;
      },
      error: () => {
        this.loadingSubtasks = false;
        this.snackBar.open('Failed to load subtasks', 'Close', { duration: 3000 });
      }
    });
  }

  updateAssignee(userId: string) {
    const member = this.projectMembers.find(m => m.userId === userId);
    const payload = {
      assignedTo: userId,
      assignedToName: member ? (member.name || member.email) : '',
      assignedToModel: member ? member.userModel : ''
    };
    
    this.taskService.update(this.task._id, payload).subscribe({
      next: (res: any) => {
        this.task.assignedTo = userId;
        this.task.assignedToName = payload.assignedToName;
        // Optionally update activity log or other UI parts
      }
    });
  }

  get isOverdue() { return this.task?.dueDate && new Date(this.task.dueDate) < new Date() && this.task.status !== 'done'; }
  formatStatus(s: string) { return s?.replace('_', ' ') || ''; }
  getTimePct() {
    if (!this.task?.estimatedHours) return 0;
    return Math.min(100, Math.round((this.task.loggedHours / this.task.estimatedHours) * 100));
  }

  updateStatus(status: string) {
    this.taskService.updateStatus(this.task._id, status).subscribe({
      next: () => { this.task.status = status; }
    });
  }

  addComment() {
    if (!this.commentText.trim()) return;
    this.taskService.addComment(this.task._id, this.commentText).subscribe({
      next: (res: any) => {
        this.task.comments = res.comments;
        this.commentText = '';
        this.snackBar.open('Comment posted', 'Close', { duration: 2000 });
      },
      error: () => { this.snackBar.open('Failed to post comment', 'Close', { duration: 3000 }); }
    });
  }

  logTime() {
    this.hoursError = '';
    const hours = Number(this.timeLog.hours);
    if (!hours || hours < 0.25 || hours > 24) {
      this.hoursError = 'Hours must be between 0.25 and 24';
      return;
    }
    this.submittingLog = true;
    this.taskService.logTime(this.task._id, this.timeLog).subscribe({
      next: (res: any) => {
        this.timeLogs.unshift(res.log);
        this.task.loggedHours = res.loggedHours;
        this.timeLog = { hours: null, date: '', description: '' };
        this.submittingLog = false;
        this.snackBar.open('Time logged successfully', 'Close', { duration: 3000 });
      },
      error: (err: any) => {
        this.submittingLog = false;
        const msg = err?.error?.message || 'Failed to log time';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }
}
