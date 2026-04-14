import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { SharedDashboardComponent } from './dashboard/shared-dashboard.component';
import { HomeComponent } from './home/home.component';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { managerHrGuard } from './guards/manager-hr.guard';
import { AddUserComponent } from './admin/add-user/add-user.component';
import { LeaveApprovalsComponent } from './dashboard/leave-approvals/leave-approvals.component';
import { TeamCalendarComponent } from './dashboard/team-calendar/team-calendar.component';
import { ProjectListComponent } from './projects/project-list/project-list.component';
import { ProjectDetailComponent } from './projects/project-detail/project-detail.component';
import { ProjectFormComponent } from './projects/project-form/project-form.component';
import { MyTasksComponent } from './projects/my-tasks/my-tasks.component';
import { TaskDetailComponent } from './projects/task-detail/task-detail.component';
import { ProjectAnalyticsComponent } from './projects/project-analytics/project-analytics.component';
import { TimesheetComponent } from './projects/timesheet/timesheet.component';
import { WorkloadComponent } from './projects/workload/workload.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'admin/dashboard',
    component: DashboardComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'dashboard',
    component: SharedDashboardComponent,
    canActivate: [managerHrGuard]
  },
  {
    path: 'admin/add-users',
    loadComponent: () => import('./admin/add-user/add-user.component').then(m => m.AddUserComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/add-manager',
    loadComponent: () => import('./admin/add-manager/add-manager.component').then(m => m.AddManagerComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-employee',
    loadComponent: () => import('./admin/manage-employee/manage-employee.component').then(m => m.ManageEmployeeComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-department',
    loadComponent: () => import('./admin/manage-department/manage-department.component').then(m => m.ManageDepartmentComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-designation',
    loadComponent: () => import('./admin/manage-designation/manage-designation.component').then(m => m.ManageDesignationComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-hr',
    loadComponent: () => import('./admin/manage-hr/manage-hr.component').then(m => m.ManageHRComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/attendance-settings',
    loadComponent: () => import('./admin/attendance-settings/attendance-settings.component').then(m => m.AttendanceSettingsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'dashboard/employees',
    loadComponent: () => import('./dashboard/employees/employees.component').then(m => m.HREmployeesComponent),
    canActivate: [managerHrGuard]
  },
  {
    path: 'dashboard/manage-managers',
    loadComponent: () => import('./dashboard/manage-managers/manage-managers.component').then(m => m.HRManageManagersComponent),
    canActivate: [managerHrGuard]
  },
  {
    path: 'dashboard/leave-approvals',
    loadComponent: () => import('./dashboard/leave-approvals/leave-approvals.component').then(m => m.LeaveApprovalsComponent),
    canActivate: [managerHrGuard]
  },
  {
    path: 'dashboard/my-leaves',
    loadComponent: () => import('./dashboard/my-leaves/my-leaves.component').then(m => m.MyLeavesComponent),
    canActivate: [managerHrGuard]
  },
  {
    path: 'admin/leave-policy',
    loadComponent: () => import('./admin/leave-policy/leave-policy.component').then(m => m.LeavePolicyComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/year-end',
    loadComponent: () => import('./admin/year-end-processing/year-end-processing.component').then(m => m.YearEndProcessingComponent),
    canActivate: [adminGuard]
  },
  { path: 'dashboard/add-users', component: AddUserComponent },
  { path: 'dashboard/leave-approvals', component: LeaveApprovalsComponent },
  { path: 'dashboard/team-calendar', component: TeamCalendarComponent },
  {
    path: 'dashboard/attendance',
    loadComponent: () => import('./dashboard/attendance/attendance.component').then(m => m.AttendanceComponent),
    canActivate: [managerHrGuard]
  },
  {
    path: 'dashboard/manager-approvals',
    loadComponent: () => import('./dashboard/manager-approvals/manager-approvals.component').then(m => m.ManagerApprovalsComponent),
    canActivate: [managerHrGuard]
  },
  {
    path: 'dashboard/my-team',
    loadComponent: () => import('./dashboard/my-team/my-team.component').then(m => m.MyTeamComponent),
    canActivate: [managerHrGuard]
  },
  {
    path: 'dashboard/escalation-log',
    loadComponent: () => import('./dashboard/escalation-log/escalation-log.component').then(m => m.EscalationLogComponent),
    canActivate: [authGuard]
  },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },

  { path: 'projects', component: ProjectListComponent, canActivate: [authGuard] },
  { path: 'projects/new', component: ProjectFormComponent, canActivate: [authGuard] },
  { path: 'projects/analytics', component: ProjectAnalyticsComponent, canActivate: [authGuard] },
  { path: 'projects/:id', component: ProjectDetailComponent, canActivate: [authGuard] },
  { path: 'projects/:id/edit', component: ProjectFormComponent, canActivate: [authGuard] },
  { path: 'projects/:id/workload', component: WorkloadComponent, canActivate: [authGuard] },
  { path: 'my-tasks', component: MyTasksComponent, canActivate: [authGuard] },
  { path: 'tasks/:id', component: TaskDetailComponent, canActivate: [authGuard] },
  { path: 'timesheets/:employeeId', component: TimesheetComponent, canActivate: [authGuard] },

  {
    path: 'unauthorized',
    loadComponent: () => import('./unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '',
    loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent),
    pathMatch: 'full'
  },
  { path: '**', loadComponent: () => import('./not-found/not-found.component').then(m => m.NotFoundComponent) }
];
