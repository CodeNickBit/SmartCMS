import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { SharedSidebarComponent } from '../../dashboard/components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';
import { AdminSidebarComponent } from '../../admin/components/sidebar/sidebar.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SharedSidebarComponent, AdminSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-[#101935] text-white font-sans overflow-hidden">
      <app-admin-sidebar *ngIf="isAdmin" class="flex-shrink-0"></app-admin-sidebar>
      <app-shared-sidebar *ngIf="!isAdmin" class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header title="Project Board"></app-shared-header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar bg-[#101935]">
          <div class="detail-page" *ngIf="project">
            <div class="detail-header">
        <button class="btn-back" (click)="router.navigate(['/projects'])">← All Projects</button>
        <div class="header-main">
          <div class="title-row">
            <h1>{{ project.title }}</h1>
            <span class="status-badge status-{{ project.status }}">{{ formatStatus(project.status) }}</span>
            <span class="priority-badge priority-{{ project.priority }}">{{ project.priority }}</span>
          </div>
          <p class="project-desc" *ngIf="project.description">{{ project.description }}</p>
          <div class="meta-row">
            <span *ngIf="project.department">🏢 {{ project.department }}</span>
            <span *ngIf="project.startDate">📅 {{ project.startDate | date:'mediumDate' }}</span>
            <span *ngIf="project.endDate">→ {{ project.endDate | date:'mediumDate' }}</span>
            <span>👥 {{ project.members?.length || 0 }} members</span>
          </div>
          <div class="tags" *ngIf="project.tags?.length">
            <span class="tag" *ngFor="let t of project.tags">{{ t }}</span>
          </div>
        </div>
        <div class="header-actions" *ngIf="canManage">
          <button class="btn-secondary" (click)="router.navigate(['/projects', project._id, 'edit'])">Edit</button>
          <button class="btn-primary" (click)="showTaskForm = true">+ Add Task</button>
        </div>
      </div>

      <div class="milestones-bar" *ngIf="project.milestones?.length">
        <h3>Milestones</h3>
        <div class="milestone-chips">
          <div class="milestone-chip" *ngFor="let m of project.milestones" [class.done]="m.isCompleted">
            <span class="m-check">{{ m.isCompleted ? '✅' : '⏳' }}</span>
            <span>{{ m.title }}</span>
            <span class="m-date" *ngIf="m.dueDate">{{ m.dueDate | date:'MMM d' }}</span>
          </div>
        </div>
      </div>

      <div class="kanban-section">
        <h2>Task Board</h2>
        <div class="kanban-board">
          <div class="kanban-col" *ngFor="let col of columns">
            <div class="col-header">
              <span class="col-dot" [ngClass]="col.key"></span>
              <h3>{{ col.label }}</h3>
              <span class="task-count">{{ getColTasks(col.key).length }}</span>
            </div>
            <div class="task-list">
              <div class="task-card" *ngFor="let t of getColTasks(col.key)" (click)="openTask(t)">
                <div class="task-card-header">
                  <span class="task-priority priority-{{ t.priority }}">{{ t.priority }}</span>
                  <span class="task-date" *ngIf="t.dueDate" [class.overdue]="isOverdue(t)">{{ t.dueDate | date:'MMM d' }}</span>
                </div>
                <p class="task-title">{{ t.title }}</p>
                <p class="task-desc" *ngIf="t.description">{{ t.description | slice:0:80 }}{{ t.description.length > 80 ? '...' : '' }}</p>
                <div class="task-footer">
                  <span class="assignee" *ngIf="t.assignedToName">{{ t.assignedToName }}</span>
                  <div class="task-meta">
                    <span *ngIf="t.comments?.length">💬 {{ t.comments.length }}</span>
                    <span *ngIf="t.loggedHours">⏱ {{ t.loggedHours }}h</span>
                  </div>
                </div>
                <div class="status-actions" *ngIf="canUpdateTask(t)">
                  <select (click)="$event.stopPropagation()" (change)="changeStatus(t, $any($event.target).value)">
                    <option *ngFor="let c of columns" [value]="c.key" [selected]="c.key === t.status">{{ c.label }}</option>
                  </select>
                </div>
              </div>
              <div class="empty-col" *ngIf="getColTasks(col.key).length === 0">No tasks</div>
            </div>
          </div>
        </div>
      </div>

      <div class="overlay" *ngIf="showTaskForm" (click)="showTaskForm = false">
        <div class="task-form-modal" (click)="$event.stopPropagation()">
          <h3>Add New Task</h3>
          <div class="form-group"><label>Title *</label><input [(ngModel)]="newTask.title" placeholder="Task title"></div>
          <div class="form-group"><label>Description</label><textarea [(ngModel)]="newTask.description" rows="2"></textarea></div>
          <div class="form-group"><label>Priority</label>
            <select [(ngModel)]="newTask.priority">
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </select>
          </div>
          <div class="form-group"><label>Due Date</label><input type="date" [(ngModel)]="newTask.dueDate"></div>
          <div class="form-group"><label>Assign To</label>
            <select [(ngModel)]="newTask.assignedTo">
              <option value="">Unassigned</option>
              <option *ngFor="let m of project.members" [value]="m.userId">{{ m.name || m.email }} ({{ m.role }})</option>
            </select>
          </div>
          <div class="form-group"><label>Estimated Hours</label><input type="number" [(ngModel)]="newTask.estimatedHours" min="0"></div>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="showTaskForm = false">Cancel</button>
            <button class="btn-primary" (click)="createTask()" [disabled]="!newTask.title">Create Task</button>
          </div>
        </div>
      </div>
    </div>
          <div class="loading-state" *ngIf="!project && loading">
            <div class="spinner"></div><p>Loading project...</p>
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
    
    .detail-page { max-width: 1400px; margin: 0 auto; width: 100%; overflow-x: hidden; }
    .btn-back { background: none; border: 1px solid rgba(30, 58, 138, 0.3); padding: 8px 16px; border-radius: 8px; cursor: pointer; color: #94a3b8; font-size: 14px; margin-bottom: 20px; display: inline-flex; align-items: center; justify-content: center; width: max-content; white-space: nowrap; transition: all 0.2s; }
    .btn-back:hover { background: rgba(30, 58, 138, 0.2); color: white; }
    .detail-header { display: flex; flex-direction: column; gap: 4px; margin-bottom: 28px; }
    .header-main { flex: 1; }
    .title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
    .title-row h1 { font-size: 26px; font-weight: 700; color: white; margin: 0; }
    .status-badge, .priority-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; text-transform: capitalize; }
    .status-planning{background:rgba(59, 130, 246, 0.2);color:#60a5fa}.status-active{background:rgba(34, 197, 94, 0.2);color:#4ade80}.status-on_hold{background:rgba(245, 158, 11, 0.2);color:#fbbf24}.status-completed{background:rgba(16, 185, 129, 0.2);color:#34d399}.status-archived{background:rgba(148, 163, 184, 0.2);color:#94a3b8}
    .priority-low{background:rgba(34, 197, 94, 0.2);color:#4ade80}.priority-medium{background:rgba(245, 158, 11, 0.2);color:#fbbf24}.priority-high{background:rgba(234, 88, 12, 0.2);color:#f97316}.priority-critical{background:rgba(239, 68, 68, 0.2);color:#f87171}
    .project-desc { color: #94a3b8; font-size: 14px; margin: 0 0 8px; }
    .meta-row { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: #94a3b8; margin-bottom: 8px; }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; }
    .tag { background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 10px; border-radius: 99px; font-size: 12px; }
    .header-actions { display: flex; gap: 10px; margin-top: 12px; }
    .btn-primary { background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; width: max-content; white-space: nowrap; transition: opacity 0.2s; }
    .btn-primary:hover:not(:disabled) { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: rgba(30, 58, 138, 0.3); color: #cbd5e1; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; width: max-content; white-space: nowrap; }
    .btn-secondary:hover { background: rgba(30, 58, 138, 0.5); color: white; }
    
    .milestones-bar { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 12px; padding: 18px 22px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .milestones-bar h3 { margin: 0 0 12px; font-size: 15px; color: white; }
    .milestone-chips { display: flex; gap: 10px; flex-wrap: wrap; }
    .milestone-chip { display: flex; align-items: center; gap: 6px; background: #101935; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 8px; padding: 6px 12px; font-size: 13px; color: #cbd5e1; }
    .milestone-chip.done { background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.3); color: #4ade80; }
    .m-date { color: #64748b; font-size: 12px; }
    
    .kanban-section h2 { font-size: 18px; font-weight: 700; color: white; margin: 0 0 16px; }
    .kanban-board { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 12px; }
    .kanban-board::-webkit-scrollbar { height: 8px; }
    .kanban-board::-webkit-scrollbar-track { background: transparent; }
    .kanban-board::-webkit-scrollbar-thumb { background: rgba(30, 58, 138, 0.5); border-radius: 10px; }
    .kanban-col { background: rgba(30, 58, 138, 0.1); border-radius: 12px; padding: 14px; min-width: 270px; flex: 1; border: 1px solid rgba(30, 58, 138, 0.3); }
    .col-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .col-dot { width: 10px; height: 10px; border-radius: 50%; }
    .col-dot.todo{background:#94a3b8}.col-dot.in_progress{background:#3b82f6}.col-dot.in_review{background:#f59e0b}.col-dot.done{background:#22c55e}.col-dot.blocked{background:#ef4444}
    .col-header h3 { font-size: 14px; font-weight: 600; color: white; margin: 0; flex: 1; }
    .task-count { background: rgba(30, 58, 138, 0.4); color: #cbd5e1; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 99px; }
    
    .task-list { display: flex; flex-direction: column; gap: 10px; }
    .task-card { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 10px; padding: 14px; cursor: pointer; transition: border-color 0.2s, transform 0.15s; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1); }
    .task-card:hover { border-color: rgba(59, 130, 246, 0.5); transform: translateY(-1px); }
    .task-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .task-priority { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    .task-date { font-size: 11px; color: #94a3b8; }
    .task-date.overdue { color: #f87171; font-weight: 600; }
    .task-title { font-size: 14px; font-weight: 600; color: white; margin: 0 0 4px; }
    .task-desc { font-size: 12px; color: #94a3b8; margin: 0 0 8px; line-height: 1.4; }
    .task-footer { display: flex; justify-content: space-between; align-items: center; }
    .assignee { font-size: 12px; color: #60a5fa; font-weight: 500; }
    .task-meta { display: flex; gap: 8px; font-size: 12px; color: #64748b; }
    .status-actions { margin-top: 8px; border-top: 1px solid rgba(30, 58, 138, 0.3); padding-top: 8px; }
    .status-actions select { width: 100%; padding: 6px 8px; border: 1px solid rgba(30, 58, 138, 0.3); background: #101935; color: white; border-radius: 6px; font-size: 12px; cursor: pointer; }
    .empty-col { text-align: center; color: #64748b; font-size: 13px; padding: 20px; border: 1px dashed rgba(30, 58, 138, 0.3); border-radius: 10px; }
    
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #94a3b8; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(30, 58, 138, 0.3); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .task-form-modal { background: #1B264F; border-radius: 14px; padding: 28px; width: 100%; max-width: 480px; border: 1px solid rgba(30, 58, 138, 0.4); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .task-form-modal h3 { margin: 0 0 20px; font-size: 18px; font-weight: 700; color: white; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #cbd5e1; }
    .form-group input, .form-group textarea, .form-group select { padding: 10px 14px; border: 1px solid rgba(30, 58, 138, 0.3); background: #101935; color: white; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: #3b82f6; }
    .form-group textarea { resize: none; font-family: inherit; }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
  `]
})
export class ProjectDetailComponent implements OnInit {
  project: any = null;
  tasks: any[] = [];
  loading = true;
  canManage = false;
  currentUser: any;
  showTaskForm = false;
  newTask: any = { title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '', estimatedHours: 0 };

  userRole: string = '';
  isAdmin: boolean = false;

  columns = [
    { key: 'todo', label: 'To Do' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'in_review', label: 'In Review' },
    { key: 'done', label: 'Done' },
    { key: 'blocked', label: 'Blocked' }
  ];

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private taskService: TaskService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.currentUser = this.auth.getUser();
    this.userRole = this.currentUser?.role?.toLowerCase() || '';
    this.isAdmin = this.userRole === 'admin';
    const id = this.route.snapshot.paramMap.get('id')!;
    this.projectService.getById(id).subscribe({
      next: (data: any) => {
        this.project = data.project;
        this.tasks = data.tasks || [];
        this.loading = false;
        const uid = String(this.currentUser?._id || this.currentUser?.id);
        const role = this.userRole;
        this.canManage = this.isAdmin || role === 'manager';
      },
      error: () => { this.loading = false; }
    });
  }

  getColTasks(status: string) { return this.tasks.filter(t => t.status === status); }
  formatStatus(s: string) { return s?.replace('_', ' ') || ''; }
  isOverdue(t: any) { return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'; }
  canUpdateTask(t: any) {
    const uid = String(this.currentUser?._id || this.currentUser?.id);
    const role = this.currentUser?.role;
    return role === 'admin' || role === 'manager' || t.assignedTo === uid;
  }

  openTask(t: any) { this.router.navigate(['/tasks', t._id]); }

  changeStatus(task: any, status: string) {
    this.taskService.updateStatus(task._id, status).subscribe({
      next: () => { task.status = status; }
    });
  }

  createTask() {
    if (!this.newTask.title) return;
    
    // Find assignee details if any
    if (this.newTask.assignedTo) {
      const member = this.project.members.find((m: any) => m.userId === this.newTask.assignedTo);
      if (member) {
        this.newTask.assignedToName = member.name || member.email || '';
        this.newTask.assignedToModel = member.userModel;
      }
    }

    this.taskService.create(this.project._id, this.newTask).subscribe({
      next: (res: any) => {
        this.tasks.push(res.task);
        this.showTaskForm = false;
        this.newTask = { title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '', estimatedHours: 0 };
      }
    });
  }
}
