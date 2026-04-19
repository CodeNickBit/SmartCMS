import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
  imports: [CommonModule, DatePipe, RouterModule, FormsModule, SharedSidebarComponent, AdminSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] text-slate-800 light:text-[#0D1B35] dark:text-white font-sans overflow-hidden">
      <app-admin-sidebar *ngIf="isAdmin" class="flex-shrink-0"></app-admin-sidebar>
      <app-shared-sidebar *ngIf="!isAdmin && userRole !== 'employee'" class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header title="Project Board"></app-shared-header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935]">
          <div class="detail-page" *ngIf="project">

            <div class="flex gap-3 mb-5">
              <button *ngIf="userRole === 'employee'"
                (click)="router.navigate(['/home'])"
                class="inline-flex items-center gap-1.5 bg-transparent border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-500 light:text-[#7A96B2] dark:text-slate-400 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-blue-900/20 hover:text-white transition-all">
                ← Back to Dashboard
              </button>
              <button
                (click)="router.navigate(['/projects'])"
                class="inline-flex items-center gap-1.5 bg-transparent border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-500 light:text-[#7A96B2] dark:text-slate-400 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-blue-900/20 hover:text-white transition-all">
                ← All Projects
              </button>
            </div>

            <div class="bg-white light:bg-[#DDEAF8] dark:bg-[#1B264F] border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 rounded-2xl p-6 mb-6 shadow-md">
              <div class="flex flex-col gap-4">

                <div class="flex items-start justify-between gap-4 flex-wrap">
                  <div class="flex items-center gap-3 flex-wrap">
                    <h1 class="text-2xl font-bold text-slate-800 light:text-[#0D1B35] dark:text-white m-0">{{ project?.title }}</h1>
                    <span class="text-[11px] font-semibold px-2.5 py-1 rounded-md capitalize"
                      [ngClass]="{
                        'bg-blue-500/20 text-blue-400': project?.status === 'planning',
                        'bg-green-500/20 text-green-400': project?.status === 'active',
                        'bg-amber-500/20 text-amber-400': project?.status === 'on_hold',
                        'bg-emerald-500/20 text-emerald-400': project?.status === 'completed',
                        'bg-slate-500/20 text-slate-500 light:text-[#7A96B2] dark:text-slate-400': project?.status === 'archived'
                      }">{{ formatStatus(project?.status) }}</span>
                    <span class="text-[11px] font-semibold px-2.5 py-1 rounded-md capitalize"
                      [ngClass]="{
                        'bg-green-500/20 text-green-400': project?.priority === 'low',
                        'bg-amber-500/20 text-amber-400': project?.priority === 'medium',
                        'bg-orange-500/20 text-orange-400': project?.priority === 'high',
                        'bg-red-500/20 text-red-400': project?.priority === 'critical'
                      }">{{ project?.priority }}</span>
                  </div>
                  <div *ngIf="canManage" class="flex gap-2.5 shrink-0">
                    <button
                      (click)="router.navigate(['/projects', project._id, 'edit'])"
                      class="bg-blue-900/30 text-slate-600 light:text-[#3B597B] dark:text-slate-300 border-0 px-4 py-2 rounded-lg cursor-pointer text-sm font-semibold hover:bg-blue-900/50 hover:text-white transition-all">
                      Edit
                    </button>
                    <button
                      (click)="showTaskForm = true"
                      class="bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-0 px-4 py-2 rounded-lg cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity">
                      + Add Task
                    </button>
                  </div>
                </div>

                <p *ngIf="project?.description" class="text-slate-500 light:text-[#7A96B2] dark:text-slate-400 text-sm m-0 leading-relaxed">{{ project?.description }}</p>

                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <div *ngIf="project?.projectManagerName" class="flex flex-col gap-0.5">
                    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project Manager</span>
                    <span class="text-sm text-slate-200 font-medium">{{ project?.projectManagerName }}</span>
                  </div>
                  <div *ngIf="project?.department" class="flex flex-col gap-0.5">
                    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</span>
                    <span class="text-sm text-slate-200 font-medium">{{ project?.department }}</span>
                  </div>
                  <div *ngIf="project?.startDate" class="flex flex-col gap-0.5">
                    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Date</span>
                    <span class="text-sm text-slate-200 font-medium">{{ project?.startDate | date:'mediumDate' }}</span>
                  </div>
                  <div *ngIf="project?.endDate" class="flex flex-col gap-0.5">
                    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Date</span>
                    <span class="text-sm text-slate-200 font-medium">{{ project?.endDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Members</span>
                    <span class="text-sm text-slate-200 font-medium">{{ project?.members?.length || 0 }}</span>
                  </div>
                </div>

                <div *ngIf="project?.tags?.length" class="flex flex-wrap gap-2">
                  <span
                    *ngFor="let tag of project.tags"
                    class="bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {{ tag }}
                  </span>
                </div>

                <div *ngIf="project?.milestones?.length" class="border-t border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 pt-4">
                  <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Milestones</p>
                  <div class="flex flex-wrap gap-2">
                    <div
                      *ngFor="let m of project.milestones"
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                      [ngClass]="m.isCompleted
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-slate-50 light:bg-[#EEF3FA] dark:bg-[#101935] border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-600 light:text-[#3B597B] dark:text-slate-300'">
                      <span>{{ m.isCompleted ? '✅' : '⏳' }}</span>
                      <span>{{ m.title }}</span>
                      <span *ngIf="m.dueDate" class="text-slate-500 text-[11px]">· {{ m.dueDate | date:'MMM d' }}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

      <div class="main-content-grid">
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
                <div class="task-card" *ngFor="let t of getColTasks(col.key)" [class.overdue-card]="isOverdue(t)">
                  <div class="task-card-header" (click)="openTask(t)">
                    <span class="task-priority priority-{{ t.priority }}">{{ t.priority }}</span>
                    <span class="task-date" *ngIf="t.dueDate" [class.overdue]="isOverdue(t)">{{ t.dueDate | date:'MMM d' }}</span>
                  </div>
                  <p class="task-title" (click)="openTask(t)">{{ t.title }}</p>
                  <p class="task-desc" *ngIf="t.description" (click)="openTask(t)">{{ t.description | slice:0:80 }}{{ t.description.length > 80 ? '...' : '' }}</p>
                  <div class="task-footer" (click)="openTask(t)">
                    <span class="assignee" *ngIf="t.assignedToName">{{ t.assignedToName }}</span>
                    <div class="task-meta">
                      <span *ngIf="t.comments?.length">💬 {{ t.comments.length }}</span>
                      <span *ngIf="t.loggedHours">⏱ {{ t.loggedHours }}h</span>
                    </div>
                  </div>
                  <div class="task-card-actions" (click)="$event.stopPropagation()">
                    <button *ngIf="canManage" class="btn-subtask" (click)="openSubtaskForm(t)" title="Add subtask">+ Subtask</button>
                    <div class="status-actions">
                      <select [ngModel]="t.status" (ngModelChange)="changeStatus(t, $event)" [disabled]="!canUpdateTask(t)">
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="in_review">In Review</option>
                        <option value="done">Done</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="empty-col" *ngIf="getColTasks(col.key).length === 0">No {{ col.label }} tasks</div>
              </div>
            </div>
          </div>
        </div>

        <div class="team-sidebar">
          <div class="sidebar-card">
            <div class="card-title">
              <h3>Project Team</h3>
              <span class="count-badge">{{ project.members?.length || 0 }}</span>
            </div>
            
            <div class="hierarchy-group" *ngIf="getProjectManager() as pm">
              <label>Primary Owner</label>
              <div class="member-item lead-item">
                <div class="avatar">{{ pm.name?.charAt(0) }}</div>
                <div class="m-info">
                  <p class="m-name">{{ pm.name }}</p>
                  <p class="m-role">Project Manager</p>
                </div>
              </div>
            </div>

            <div class="hierarchy-group" *ngIf="getLeads().length">
              <label>Technical Leads</label>
              <div class="member-item" *ngFor="let m of getLeads()">
                <div class="avatar lead-avatar">{{ m.name?.charAt(0) }}</div>
                <div class="m-info">
                  <p class="m-name">{{ m.name }}</p>
                  <p class="m-role">{{ m.role === 'lead' ? 'Tech Lead' : 'Manager' }}</p>
                </div>
              </div>
            </div>

            <div class="hierarchy-group" *ngIf="getMembers().length">
              <label>Contributors</label>
              <div class="member-item" *ngFor="let m of getMembers()">
                <div class="avatar member-avatar">{{ m.name?.charAt(0) }}</div>
                <div class="m-info">
                  <p class="m-name">{{ m.name }}</p>
                  <p class="m-role">Member</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="overlay" *ngIf="showTaskForm" (click)="closeTaskForm()">
        <div class="task-form-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ newTask.parentTask ? '↳ Add Subtask' : 'Add New Task' }}</h3>
            <div class="modal-subtitle" *ngIf="newTask.parentTask">
              <span class="parent-label">Parent:</span>
              <span class="parent-name">{{ getTaskTitle(newTask.parentTask) }}</span>
              <button class="clear-parent" (click)="newTask.parentTask = ''">✕</button>
            </div>
          </div>
          <div class="form-group"><label>Title *</label><input [(ngModel)]="newTask.title" placeholder="Task title" autofocus></div>
          <div class="form-group"><label>Description</label><textarea [(ngModel)]="newTask.description" rows="2" placeholder="Optional description"></textarea></div>
          <div class="form-row">
            <div class="form-group">
              <label>Priority</label>
              <select [(ngModel)]="newTask.priority">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div class="form-group">
              <label>Due Date</label>
              <input type="date" [(ngModel)]="newTask.dueDate">
            </div>
          </div>
          <div class="form-group"><label>Assign To</label>
            <select [(ngModel)]="newTask.assignedTo">
              <option value="">Unassigned</option>
              <option *ngIf="getProjectManager() as pm" [value]="pm.userId">{{ pm.name }} (Project Manager)</option>
              <option *ngFor="let m of project.members" [value]="m.userId">{{ m.name || m.email }} ({{ m.role }})</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Estimated Hours</label>
              <input type="number" [(ngModel)]="newTask.estimatedHours" min="0" placeholder="0">
            </div>
            <div class="form-group">
              <label>Parent Task <span class="optional-hint">(optional)</span></label>
              <select [(ngModel)]="newTask.parentTask">
                <option value="">None — top-level task</option>
                <option *ngFor="let t of getTopLevelTasks()" [value]="t._id">{{ t.title }}</option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="closeTaskForm()">Cancel</button>
            <button class="btn-primary" (click)="createTask()" [disabled]="!newTask.title || creatingTask">
              {{ creatingTask ? 'Creating...' : (newTask.parentTask ? 'Add Subtask' : 'Create Task') }}
            </button>
          </div>
        </div>
      </div>
    </div>
          <div class="loading-state" *ngIf="!project && loading">
            <div class="spinner"></div><p>Loading project...</p>
          </div>
          <div class="error-state" *ngIf="!project && !loading">
            <p>⚠️ Failed to load project. You may not have access or the project does not exist.</p>
            <button (click)="router.navigate(['/projects'])" class="inline-flex items-center gap-1.5 bg-transparent border border-slate-200 light:border-[#1A6DC2]/18 dark:border-blue-900/30 text-slate-500 light:text-[#7A96B2] dark:text-slate-400 px-4 py-2 rounded-lg text-sm cursor-pointer mt-3 hover:bg-blue-900/20 hover:text-white transition-all">← Back to Projects</button>
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
    
    .kanban-section h2 { font-size: 18px; font-weight: 700; color: white; margin: 0 0 16px; }
    .kanban-board { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 12px; min-height: 500px; }
    .kanban-board::-webkit-scrollbar { height: 8px; }
    .kanban-board::-webkit-scrollbar-track { background: transparent; }
    .kanban-board::-webkit-scrollbar-thumb { background: rgba(30, 58, 138, 0.5); border-radius: 10px; }
    .kanban-board::-webkit-scrollbar-thumb:hover { background: #3083DC; }
    .kanban-col { background: rgba(30, 58, 138, 0.1); border-radius: 12px; padding: 14px; min-width: 280px; max-width: 350px; flex: 1; border: 1px solid rgba(30, 58, 138, 0.3); display: flex; flex-direction: column; }
    .kanban-section { min-width: 0; }
    .col-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-shrink: 0; }
    .col-dot { width: 10px; height: 10px; border-radius: 50%; }
    .col-dot.todo{background:#94a3b8}.col-dot.in_progress{background:#3b82f6}.col-dot.in_review{background:#f59e0b}.col-dot.done{background:#22c55e}.col-dot.blocked{background:#ef4444}
    .col-header h3 { font-size: 14px; font-weight: 600; color: white; margin: 0; flex: 1; }
    .task-count { background: rgba(30, 58, 138, 0.4); color: #cbd5e1; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 99px; }
    
    .task-list { display: flex; flex-direction: column; gap: 10px; }
    .task-card { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 10px; padding: 14px; cursor: pointer; transition: border-color 0.2s, transform 0.15s; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1); }
    .task-card:hover { border-color: rgba(59, 130, 246, 0.5); transform: translateY(-1px); }
    .task-card.overdue-card { border-color: rgba(239, 68, 68, 0.6); box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.2); }
    .task-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .task-priority { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    .task-date { font-size: 11px; color: #94a3b8; }
    .task-date.overdue { color: #f87171; font-weight: 600; }
    .task-title { font-size: 14px; font-weight: 600; color: white; margin: 0 0 4px; }
    .task-desc { font-size: 12px; color: #94a3b8; margin: 0 0 8px; line-height: 1.4; }
    .task-footer { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .assignee { font-size: 12px; color: #60a5fa; font-weight: 500; }
    .task-meta { display: flex; gap: 8px; font-size: 12px; color: #64748b; }
    .task-card-actions { margin-top: 8px; border-top: 1px solid rgba(30, 58, 138, 0.3); padding-top: 8px; display: flex; gap: 6px; align-items: center; }
    .status-actions { flex: 1; }
    .status-actions select { width: 100%; padding: 5px 8px; border: 1px solid rgba(30, 58, 138, 0.3); background: #101935; color: white; border-radius: 6px; font-size: 12px; cursor: pointer; outline: none; transition: border-color 0.2s; }
    .status-actions select:hover { border-color: rgba(59, 130, 246, 0.4); }
    .status-actions select:focus { border-color: #3b82f6; }
    .btn-subtask { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.25); padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
    .btn-subtask:hover { background: rgba(99, 102, 241, 0.3); color: #c7d2fe; border-color: rgba(99, 102, 241, 0.5); }
    .empty-col { text-align: center; color: #64748b; font-size: 13px; padding: 20px; border: 1px dashed rgba(30, 58, 138, 0.3); border-radius: 10px; }
    
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #94a3b8; }
    .error-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #f87171; text-align: center; font-size: 15px; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(30, 58, 138, 0.3); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .task-form-modal { background: #1B264F; border-radius: 14px; padding: 28px; width: 100%; max-width: 520px; border: 1px solid rgba(30, 58, 138, 0.4); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .modal-header { margin-bottom: 20px; }
    .task-form-modal h3 { margin: 0 0 6px; font-size: 18px; font-weight: 700; color: white; }
    .modal-subtitle { display: flex; align-items: center; gap: 6px; font-size: 12px; }
    .parent-label { color: #64748b; font-weight: 600; }
    .parent-name { color: #a5b4fc; font-weight: 500; background: rgba(99, 102, 241, 0.1); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(99, 102, 241, 0.2); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .clear-parent { background: none; border: none; color: #64748b; cursor: pointer; font-size: 12px; padding: 0 2px; line-height: 1; transition: color 0.2s; }
    .clear-parent:hover { color: #f87171; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .optional-hint { font-size: 11px; color: #64748b; font-weight: 400; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #cbd5e1; }
    .form-group input, .form-group textarea, .form-group select { padding: 10px 14px; border: 1px solid rgba(30, 58, 138, 0.3); background: #101935; color: white; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; max-width: 100%; box-sizing: border-box; width: 100%; text-overflow: ellipsis; }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: #3b82f6; }
    .form-group textarea { resize: none; font-family: inherit; }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
    .btn-secondary { background: rgba(30, 58, 138, 0.3); color: #94a3b8; border: 1px solid rgba(30, 58, 138, 0.4); padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; }
    .btn-secondary:hover { background: rgba(30, 58, 138, 0.5); color: white; }
    .btn-primary { background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; border: none; padding: 10px 24px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; }
    .btn-primary:hover:not(:disabled) { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Team Sidebar Styles */
    .main-content-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; }
    .team-sidebar { position: sticky; top: 0; min-width: 0; }
    .sidebar-card { background: #1B264F; border: 1px solid rgba(30, 58, 138, 0.4); border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .card-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid rgba(30, 58, 138, 0.2); }
    .card-title h3 { font-size: 16px; font-weight: 700; color: white; margin: 0; }
    .count-badge { background: rgba(59, 130, 246, 0.1); color: #60a5fa; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
    .hierarchy-group { margin-bottom: 20px; }
    .hierarchy-group label { display: block; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .member-item { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: 8px; background: rgba(16, 25, 53, 0.3); border: 1px solid rgba(30, 58, 138, 0.1); transition: all 0.2s; margin-bottom: 6px; }
    .member-item:hover { background: rgba(16, 25, 53, 0.5); border-color: rgba(59, 130, 246, 0.2); }
    .lead-item { border-left: 3px solid #6366f1; background: rgba(99, 102, 241, 0.05); }
    .avatar { width: 32px; height: 32px; border-radius: 8px; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; }
    .lead-avatar { background: #6366f1; }
    .member-avatar { background: #475569; }
    .m-info { display: flex; flex-direction: column; overflow: hidden; }
    .m-name { font-size: 13px; font-weight: 600; color: #e2e8f0; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .m-role { font-size: 10px; color: #94a3b8; margin: 0; }

    @media (max-width: 1024px) {
      .main-content-grid { grid-template-columns: 1fr; }
      .team-sidebar { order: -1; margin-bottom: 24px; }
    }
  `]
})
export class ProjectDetailComponent implements OnInit {
  project: any = null;
  tasks: any[] = [];
  loading = true;
  canManage = false;
  currentUser: any;
  showTaskForm = false;
  creatingTask = false;
  newTask: any = { title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '', estimatedHours: 0, parentTask: '' };

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

  getColTasks(status: string) { return (this.tasks || []).filter(t => t.status === status && !t.parentTask); }
  formatStatus(s: string) { return s?.replace('_', ' ') || ''; }
  isOverdue(t: any) { return t.isOverdue !== undefined ? t.isOverdue : (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'); }
  canUpdateTask(t: any) {
    const uid = String(this.currentUser?._id || this.currentUser?.id);
    const role = this.userRole; // uses lowercased role from ngOnInit
    const userEmail = this.currentUser?.email;

    if (role === 'admin') return true;
    
    // Check if user is the project manager
    const pmId = String(this.project?.projectManager);
    const pmEmail = this.project?.projectManagerEmail?.toLowerCase();
    const isPM = (uid === pmId) || (userEmail && pmEmail && userEmail.toLowerCase() === pmEmail);
    
    if (role === 'manager' && isPM) return true;

    // Check if assignee
    return String(t.assignedTo) === uid;
  }

  openTask(t: any) { this.router.navigate(['/tasks', t._id]); }

  openSubtaskForm(parentTask: any) {
    this.newTask = { title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '', estimatedHours: 0, parentTask: parentTask._id };
    this.showTaskForm = true;
  }

  closeTaskForm() {
    this.showTaskForm = false;
    this.newTask = { title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '', estimatedHours: 0, parentTask: '' };
  }

  getTopLevelTasks() { return (this.tasks || []).filter(t => !t.parentTask); }
  getTaskTitle(id: string) { return this.tasks.find(t => t._id === id)?.title || id; }

  changeStatus(task: any, status: string) {
    this.taskService.updateStatus(task._id, status).subscribe({
      next: () => { task.status = status; }
    });
  }

  createTask() {
    if (!this.newTask.title) return;
    this.creatingTask = true;

    if (this.newTask.assignedTo) {
      const pm = this.getProjectManager();
      const member = this.project.members.find((m: any) => m.userId === this.newTask.assignedTo);
      if (member) {
        this.newTask.assignedToName = member.name || member.email || '';
        this.newTask.assignedToModel = member.userModel;
      } else if (pm && pm.userId === this.newTask.assignedTo) {
        this.newTask.assignedToName = pm.name;
        this.newTask.assignedToModel = 'Manager';
      }
    }

    const payload = { ...this.newTask, estimatedHours: Number(this.newTask.estimatedHours) || 0 };
    if (!payload.parentTask) delete payload.parentTask;

    this.taskService.create(this.project._id, payload).subscribe({
      next: (res: any) => {
        this.tasks.push(res.task);
        this.creatingTask = false;
        this.closeTaskForm();
      },
      error: () => { this.creatingTask = false; }
    });
  }

  getProjectManager() {
    if (!this.project) return null;
    return {
      userId: this.project.projectManager,
      name: this.project.projectManagerName || 'Unknown Manager',
      role: 'manager'
    };
  }

  getLeads() {
    return (this.project?.members || []).filter((m: any) => 
      (m.role === 'lead' || m.role === 'manager') && 
      m.userId !== this.getProjectManager()?.userId
    );
  }

  getMembers() {
    return (this.project?.members || []).filter((m: any) => 
      m.role !== 'lead' && m.role !== 'manager'
    );
  }
}
