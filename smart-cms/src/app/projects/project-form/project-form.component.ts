import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { SharedSidebarComponent } from '../../dashboard/components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';
import { AdminSidebarComponent } from '../../admin/components/sidebar/sidebar.component';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, SharedSidebarComponent, AdminSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-[#101935] text-white font-sans overflow-hidden">
      <app-admin-sidebar *ngIf="isAdmin" class="flex-shrink-0"></app-admin-sidebar>
      <app-shared-sidebar *ngIf="!isAdmin" class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header [title]="isEdit ? 'Edit Project' : 'New Project'"></app-shared-header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar bg-[#101935]">
          <div class="form-page">
            <div class="form-header">
        <button class="btn-back" (click)="router.navigate(['/projects'])">← Back</button>
        <h1>{{ isEdit ? 'Edit Project' : 'New Project' }}</h1>
      </div>
      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-row">
            <div class="form-group">
              <label>Project Title *</label>
              <input formControlName="title" placeholder="Enter project title" [class.invalid]="isInvalid('title')">
              <span class="error" *ngIf="isInvalid('title')">Title is required</span>
            </div>
            <div class="form-group">
              <label>Project Manager *</label>
              <div class="searchable-dropdown">
                <input type="text" [(ngModel)]="pmSearchTerm" [ngModelOptions]="{standalone: true}" placeholder="Search PM..." class="search-input">
                <select formControlName="projectManager" [class.invalid]="isInvalid('projectManager')">
                  <option value="">Select a Manager</option>
                  <option *ngFor="let m of filteredPMs" [value]="m._id">{{ m.name }} ({{ m.email }})</option>
                </select>
              </div>
              <span class="error" *ngIf="isInvalid('projectManager')">Manager is required</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
               <label>Department</label>
               <input formControlName="department" placeholder="e.g. Engineering">
            </div>
            <div class="form-group">
              <label>Tags <span class="hint">(comma separated)</span></label>
              <input formControlName="tags" placeholder="e.g. frontend, design, urgent">
            </div>
          </div>
          <div class="form-group full-width">
            <label>Description</label>
            <textarea formControlName="description" rows="3" placeholder="What is this project about?"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Status *</label>
              <select formControlName="status">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div class="form-group">
              <label>Priority *</label>
              <select formControlName="priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Start Date</label>
              <input type="date" formControlName="startDate">
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input type="date" formControlName="endDate">
            </div>
          </div>

          <!-- Team Allocation Section (Keka Inspired) -->
          <div class="team-allocation-section mt-8 pt-6 border-t border-blue-900/30">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-bold">Team Allocation</h3>
                <p class="text-xs text-slate-400">Search and assign members with specific project roles</p>
              </div>
              <span class="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded uppercase tracking-wider">{{ members.length }} Allocated</span>
            </div>
            
            <!-- Search Interface -->
            <div class="search-container mb-6">
              <div class="relative">
                <input type="text" 
                       [(ngModel)]="memberSearchTerm" 
                       (focus)="showSearch = true"
                       [ngModelOptions]="{standalone: true}" 
                       placeholder="Search by name, email, department or ID..." 
                       class="search-input w-full pl-14 h-12 text-sm bg-[#0D1B35] border-blue-900/30">
                <span class="absolute left-5 top-3.5 text-slate-500 text-lg">🔍</span>
                <button *ngIf="memberSearchTerm" (click)="memberSearchTerm = ''; showSearch = false" class="absolute right-3 top-3.5 text-slate-500 hover:text-white">✕</button>
              </div>

              <!-- Search Results Dropdown -->
              <div *ngIf="showSearch && filteredAvailableUsers.length > 0" 
                   class="search-results-popup mt-2 bg-[#1B264F] border border-blue-800/50 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 overflow-x-hidden custom-scrollbar">
                <div class="p-2 border-b border-blue-900/10 bg-blue-500/5 items-center justify-between flex">
                  <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select from members</span>
                  <button (click)="showSearch = false" class="text-[10px] text-blue-400 hover:underline">Close</button>
                </div>
                <div *ngFor="let u of filteredAvailableUsers.slice(0, 50)" 
                     (click)="addMemberWithUser(u)"
                     class="flex items-center justify-between p-3 border-b border-blue-900/20 hover:bg-blue-600/10 cursor-pointer transition-colors group">
                  <div class="flex items-center gap-3">
                    <div class="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-300 border border-blue-500/10">
                      {{ u.name.charAt(0) }}
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-medium text-slate-200 group-hover:text-blue-400">{{ u.name }}</span>
                      <span class="text-[10px] text-slate-500">{{ u.role }} • {{ u.department || 'No Dept' }}</span>
                    </div>
                  </div>
                  <span class="text-xs text-blue-500 font-bold opacity-0 group-hover:opacity-100">+ Add</span>
                </div>
              </div>
              <p *ngIf="memberSearchTerm && filteredAvailableUsers.length === 0" class="text-xs text-orange-400 mt-2 px-2">No unallocated members found matching "{{ memberSearchTerm }}"</p>
            </div>

            <!-- Allocation List (Hierarchy Style) -->
            <div class="member-grid grid grid-cols-1 md:grid-cols-2 gap-3">
              <div *ngFor="let m of members; let i = index" class="allocation-item flex items-center justify-between p-3 bg-[#0D1B35] rounded-xl border border-blue-900/20 hover:border-blue-700/40 transition-all">
                <div class="flex items-center gap-3 truncate mr-2">
                  <div class="h-9 w-9 flex-shrink-0 rounded-lg bg-blue-600/20 flex items-center justify-center font-bold text-blue-400 border border-blue-500/20">
                    {{ m.name.charAt(0) }}
                  </div>
                  <div class="truncate">
                    <p class="text-xs font-bold text-slate-200 truncate">{{ m.name }}</p>
                    <p class="text-[9px] text-slate-500 uppercase tracking-tighter">{{ m.userModel }}</p>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <select class="role-badge-select" [(ngModel)]="m.projectRole" [ngModelOptions]="{standalone: true}">
                    <option value="member">Member</option>
                    <option value="lead">Technical Lead</option>
                    <option value="manager">Project Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button type="button" class="remove-member-btn" (click)="removeMember(i)">✕</button>
                </div>
              </div>
            </div>
            
            <div *ngIf="members.length === 0" class="empty-allocation text-center py-10 bg-[#0D1B35]/50 border-2 border-dashed border-blue-900/20 rounded-xl mt-4">
              <p class="text-sm text-slate-500">No team members assigned yet.</p>
            </div>
          </div>

          <div class="form-actions pt-6 mt-6 border-t border-blue-900/30">
            <button type="button" class="btn-secondary" (click)="router.navigate(['/projects'])">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || submitting">
              {{ submitting ? 'Saving...' : (isEdit ? 'Update Project' : 'Create Project') }}
            </button>
          </div>
          <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
        </form>
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
    
    .form-page { max-width: 800px; margin: 0 auto; width: 100%; }
    .form-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
    .btn-back { background: none; border: 1px solid rgba(30, 58, 138, 0.3); padding: 8px 16px; border-radius: 8px; cursor: pointer; color: #94a3b8; font-size: 14px; transition: all 0.2s; }
    .btn-back:hover { background: rgba(30, 58, 138, 0.2); color: white; }
    .form-header h1 { font-size: 24px; font-weight: 700; color: white; margin: 0; }
    .form-card { background: #1B264F; border-radius: 14px; padding: 32px; border: 1px solid rgba(30, 58, 138, 0.3); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .form-group.full-width { grid-column: 1 / -1; }
    label { font-size: 13px; font-weight: 600; color: #cbd5e1; }
    .hint { font-weight: 400; color: #64748b; font-size: 12px; }
    input, textarea, select { padding: 10px 14px; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; background: #101935; color: white; }
    input:focus, textarea:focus, select:focus { border-color: #3b82f6; background: #101935; }
    textarea { resize: vertical; font-family: inherit; }
    input.invalid { border-color: #ef4444; }
    .error { font-size: 12px; color: #ef4444; }
    .error-msg { margin-top: 12px; color: #ef4444; font-size: 14px; text-align: center; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
    .btn-primary { background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; border: none; padding: 10px 24px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; transition: opacity 0.2s; }
    .btn-primary:hover:not(:disabled) { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: rgba(30, 58, 138, 0.3); color: #cbd5e1; border: none; padding: 10px 24px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; }
    .btn-secondary:hover { background: rgba(30, 58, 138, 0.5); color: white; }
    .role-select { background: #101935; color: #e2e8f0; border: 1px solid rgba(30, 58, 138, 0.4); border-radius: 6px; padding: 4px 8px; font-size: 12px; font-weight: 600; outline: none; min-width: 100px; cursor: pointer; }
    .role-select:focus { border-color: #3b82f6; }
    .role-select option { background: #101935; color: #e2e8f0; }
    .remove-btn { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; align-items: center; }

    .searchable-dropdown { display: flex; flex-direction: column; gap: 4px; }
    .search-input { padding: 8px 12px; border: 1px solid rgba(30, 58, 138, 0.3); border-radius: 8px; font-size: 13px; background: rgba(16, 25, 53, 0.5); color: white; outline: none; transition: all 0.2s; }
    .search-input:focus { border-color: #3b82f6; background: rgba(16, 25, 53, 0.8); }

    .search-container { position: relative; }
    .search-results-popup { position: absolute; width: 100%; top: 100%; left: 0; z-index: 100; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
    .role-badge-select { background: rgba(30, 58, 138, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; cursor: pointer; outline: none; transition: all 0.2s; }
    .role-badge-select:hover { background: rgba(59, 130, 246, 0.3); border-color: #3b82f6; }
    .remove-member-btn { width: 24px; height: 24px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; border-radius: 6px; font-size: 10px; cursor: pointer; transition: all 0.2s; }
    .remove-member-btn:hover { background: #ef4444; color: white; }
  `]
})
export class ProjectFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  submitting = false;
  errorMsg = '';
  projectId = '';
  userRole = '';
  isAdmin = false;

  // Multi-user allocation state
  allUsers: any[] = [];
  managers: any[] = [];
  availableEmployees: any[] = [];
  members: any[] = []; // { userId, name, email, projectRole, userModel }
  selectedUserToAdd: string = '';
  
  // Search parameters
  pmSearchTerm: string = '';
  memberSearchTerm: string = '';
  showSearch: boolean = false;

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const user = this.auth.getUser();
    this.userRole = user?.role?.toLowerCase() || '';
    this.isAdmin = this.userRole === 'admin';

    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      department: [''],
      status: ['planning'],
      priority: ['medium'],
      startDate: [''],
      endDate: [''],
      tags: [''],
      projectManager: ['', Validators.required]
    });

    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.projectId && this.projectId !== 'new') {
      this.isEdit = true;
    }

    this.loadUsers();
  }

  loadUsers() {
    this.auth.getUsers().subscribe({
      next: (users) => {
        this.allUsers = users.map(u => ({
          ...u,
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
        }));
        this.managers = this.allUsers.filter(u => u.role === 'manager' || u.role === 'admin');
        this.updateAvailableEmployees();
        
        if (this.isEdit) {
          this.loadProject();
        }
      }
    });
  }

  get filteredPMs() {
    const s = this.pmSearchTerm.toLowerCase();
    return this.managers.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }

  get filteredAvailableUsers() {
    const s = this.memberSearchTerm.toLowerCase();
    if (!s) return this.availableEmployees;
    return this.availableEmployees.filter(u => 
      u.name.toLowerCase().includes(s) || 
      u.email.toLowerCase().includes(s) || 
      u.department?.toLowerCase().includes(s) ||
      u.employeeId?.toLowerCase().includes(s)
    );
  }

  get filteredGroupedManagers() { return this.filteredAvailableUsers.filter(u => u.role === 'manager'); }
  get filteredGroupedEmployees() { return this.filteredAvailableUsers.filter(u => u.role === 'employee'); }
  get filteredGroupedHRs() { return this.filteredAvailableUsers.filter(u => u.role === 'hr'); }
  get filteredGroupedAdmins() { return this.filteredAvailableUsers.filter(u => u.role === 'admin'); }

  get groupedManagers() { return this.availableEmployees.filter(u => u.role === 'manager'); }
  get groupedEmployees() { return this.availableEmployees.filter(u => u.role === 'employee'); }
  get groupedHRs() { return this.availableEmployees.filter(u => u.role === 'hr'); }
  get groupedAdmins() { return this.availableEmployees.filter(u => u.role === 'admin'); }

  updateAvailableEmployees() {
    const memberIds = this.members.map(m => m.userId);
    this.availableEmployees = this.allUsers.filter(u => !memberIds.includes(u._id));
  }

  addMemberWithUser(user: any) {
    if (!user) return;
    this.members.push({
      userId: user._id,
      name: user.name,
      email: user.email,
      projectRole: 'member',
      userModel: this.getUserModel(user.role)
    });
    this.memberSearchTerm = '';
    this.showSearch = false;
    this.updateAvailableEmployees();
  }

  addMember() {
    if (!this.selectedUserToAdd) return;
    const user = this.allUsers.find(u => u._id === this.selectedUserToAdd);
    if (user) {
      this.addMemberWithUser(user);
      this.selectedUserToAdd = '';
    }
  }

  removeMember(index: number) {
    this.members.splice(index, 1);
    this.updateAvailableEmployees();
  }

  getUserModel(role: string): string {
    const r = role?.toLowerCase();
    if (r === 'admin') return 'Admin';
    if (r === 'manager') return 'Manager';
    if (r === 'hr') return 'Hr';
    return 'User';
  }

  loadProject() {
    this.projectService.getById(this.projectId).subscribe({
      next: (data: any) => {
        const p = data.project;
        this.form.patchValue({
          title: p.title,
          description: p.description,
          department: p.department,
          status: p.status,
          priority: p.priority,
          startDate: p.startDate ? p.startDate.split('T')[0] : '',
          endDate: p.endDate ? p.endDate.split('T')[0] : '',
          tags: (p.tags || []).join(', '),
          projectManager: p.projectManager || ''
        });

        // Map existing members for the UI
        if (p.members && Array.isArray(p.members)) {
          this.members = p.members.map((m: any) => {
            const fallbackUser = this.allUsers.find(u => String(u._id) === String(m.userId) || (m.email && u.email === m.email));
            return {
              userId: m.userId,
              name: m.name || fallbackUser?.name || 'Unknown User',
              email: m.email || fallbackUser?.email || '',
              projectRole: m.role || 'member',
              userModel: m.userModel || (fallbackUser ? this.getUserModel(fallbackUser.role) : 'User')
            };
          });
          this.updateAvailableEmployees();
        }
      }
    });
  }

  isInvalid(field: string) { return this.form.get(field)?.invalid && this.form.get(field)?.touched; }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.errorMsg = '';
    
    const val = this.form.value;
    const membersToSubmit = this.members.map(m => ({
      userId: m.userId,
      userModel: m.userModel,
      role: m.projectRole,
      email: m.email
    }));

    const selectedPM = this.managers.find(m => m._id === val.projectManager);
    
    const payload = { 
      ...val, 
      tags: val.tags ? val.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      members: membersToSubmit,
      projectManagerModel: this.getUserModel(selectedPM?.role || 'manager'),
      projectManagerEmail: selectedPM?.email
    };

    const req = this.isEdit ? this.projectService.update(this.projectId, payload) : this.projectService.create(payload);
    req.subscribe({
      next: () => this.router.navigate(['/projects']),
      error: (err) => { this.submitting = false; this.errorMsg = err?.error?.message || 'Failed to save project'; }
    });
  }
}
