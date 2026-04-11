import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { SharedSidebarComponent } from '../../dashboard/components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';
import { AdminSidebarComponent } from '../../admin/components/sidebar/sidebar.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatSnackBarModule, SharedSidebarComponent, AdminSidebarComponent, SharedHeaderComponent],
  template: `
    <div class="flex h-screen bg-[#101935] text-white font-sans overflow-hidden">
      <app-admin-sidebar *ngIf="isAdmin" class="flex-shrink-0"></app-admin-sidebar>
      <app-shared-sidebar *ngIf="!isAdmin" class="flex-shrink-0"></app-shared-sidebar>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-shared-header title="Projects"></app-shared-header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#101935] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#1B264F] [&::-webkit-scrollbar-thumb]:rounded-full">
          <div class="max-w-[1200px] mx-auto w-full">

            <div class="flex justify-between items-start mb-7">
              <div>
                <h1 class="text-3xl font-bold text-white m-0">Projects</h1>
                <p class="text-slate-400 mt-1 text-sm">Manage and track all your projects</p>
              </div>
              <button
                *ngIf="canCreate"
                (click)="router.navigate(['/projects/new'])"
                class="flex items-center gap-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-0 px-5 py-2.5 rounded-xl cursor-pointer text-sm font-semibold whitespace-nowrap hover:opacity-90 transition-opacity">
                <span>+</span> New Project
              </button>
            </div>

            <div class="flex gap-3 mb-6 flex-wrap">
              <input
                class="flex-1 min-w-[200px] px-3.5 py-2.5 border border-blue-900/30 rounded-lg text-sm outline-none bg-[#1B264F] text-white placeholder-slate-500 focus:border-blue-500 transition-colors"
                type="text"
                placeholder="Search projects..."
                [(ngModel)]="filters.search"
                (ngModelChange)="loadProjects()">
              <select
                class="px-3.5 py-2.5 border border-blue-900/30 rounded-lg text-sm bg-[#1B264F] text-white cursor-pointer outline-none focus:border-blue-500 transition-colors"
                [(ngModel)]="filters.status"
                (ngModelChange)="loadProjects()">
                <option value="">All Status</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <select
                class="px-3.5 py-2.5 border border-blue-900/30 rounded-lg text-sm bg-[#1B264F] text-white cursor-pointer outline-none focus:border-blue-500 transition-colors"
                [(ngModel)]="filters.priority"
                (ngModelChange)="loadProjects()">
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div *ngIf="loading" class="flex flex-col items-center py-16 text-slate-400">
              <div class="w-9 h-9 border-[3px] border-blue-900/30 border-t-blue-500 rounded-full animate-spin mb-3"></div>
              <p class="text-sm">Loading projects...</p>
            </div>

            <div *ngIf="!loading" class="grid gap-5" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))">

              <div *ngIf="projects.length === 0" class="col-span-full text-center py-16 text-slate-400">
                <div class="text-5xl mb-4 opacity-80">📁</div>
                <h3 class="text-white text-lg font-semibold mb-2">No projects found</h3>
                <p class="text-sm mb-5">{{ canCreate ? 'Create your first project to get started.' : 'You have not been added to any projects yet.' }}</p>
                <button
                  *ngIf="canCreate"
                  (click)="router.navigate(['/projects/new'])"
                  class="inline-flex items-center gap-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-0 px-5 py-2.5 rounded-xl cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity">
                  Create Project
                </button>
              </div>

              <div
                *ngFor="let p of projects"
                (click)="router.navigate(['/projects', p._id])"
                class="bg-[#1B264F] rounded-2xl p-5 border border-blue-900/30 cursor-pointer transition-all duration-200 shadow-md hover:border-blue-500/50 hover:-translate-y-0.5">

                <div class="flex justify-between items-start mb-2.5 gap-2">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <h3 class="text-base font-semibold text-white m-0 truncate">{{ p.title }}</h3>
                    <span class="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize whitespace-nowrap"
                      [ngClass]="{
                        'bg-green-500/20 text-green-400': p.priority === 'low',
                        'bg-amber-500/20 text-amber-400': p.priority === 'medium',
                        'bg-orange-500/20 text-orange-400': p.priority === 'high',
                        'bg-red-500/20 text-red-400': p.priority === 'critical'
                      }">{{ p.priority }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize whitespace-nowrap"
                      [ngClass]="{
                        'bg-blue-500/20 text-blue-400': p.status === 'planning',
                        'bg-green-500/20 text-green-400': p.status === 'active',
                        'bg-amber-500/20 text-amber-400': p.status === 'on_hold',
                        'bg-emerald-500/20 text-emerald-400': p.status === 'completed',
                        'bg-slate-500/20 text-slate-400': p.status === 'archived'
                      }">{{ formatStatus(p.status) }}</span>
                    <span
                      *ngIf="getUserRoleInProject(p)"
                      class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 uppercase border border-indigo-500/20">
                      {{ getUserRoleInProject(p) }}
                    </span>
                  </div>
                </div>

                <p class="text-[13px] text-slate-400 mb-3.5 leading-relaxed line-clamp-2">{{ p.description || 'No description provided.' }}</p>

                <div class="mb-3.5" *ngIf="p.taskStats">
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-xs text-slate-400">{{ p.taskStats.done || 0 }}/{{ p.taskStats.total || 0 }} tasks done</span>
                    <span class="text-xs font-semibold text-blue-400">{{ getProgressPct(p.taskStats) }}%</span>
                  </div>
                  <div class="bg-blue-900/30 rounded-full h-1.5 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                      [style.width.%]="getProgressPct(p.taskStats)">
                    </div>
                  </div>
                </div>

                <div class="flex justify-between items-center text-[13px] text-slate-400 border-t border-blue-900/30 pt-3 mt-1">
                  <div class="flex items-center gap-1">
                    <span>👥</span> {{ p.members?.length || 0 }} members
                  </div>
                  <div *ngIf="p.endDate" class="flex items-center gap-1">
                    <span>📅</span> Due {{ p.endDate | date:'mediumDate' }}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  `
})
export class ProjectListComponent implements OnInit {
  projects: any[] = [];
  loading = false;
  canCreate = false;
  userRole: string = '';
  isAdmin: boolean = false;
  filters: any = { search: '', status: '', priority: '' };

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
    this.canCreate = this.isAdmin || this.userRole === 'manager';
    this.loadProjects();
  }

  loadProjects() {
    this.loading = true;
    this.projectService.getAll(this.filters).subscribe({
      next: (data) => { this.projects = data; this.loading = false; },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load projects. Please try again.', 'Dismiss', { duration: 4000 });
      }
    });
  }

  formatStatus(s: string) { return s?.replace('_', ' ') || ''; }

  getProgressPct(stats: any): number {
    if (!stats || !stats.total) return 0;
    return Math.round((stats.done / stats.total) * 100);
  }

  getUserRoleInProject(p: any): string {
    const uid = String(this.auth.getUser()?._id || this.auth.getUser()?.id);
    if (String(p.projectManager) === uid) return 'PM';
    const member = (p.members || []).find((m: any) => String(m.userId) === uid);
    if (member) return member.role || 'Member';
    if (String(p.createdBy) === uid) return 'Owner';
    return '';
  }
}
