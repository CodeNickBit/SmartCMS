import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { SharedDashboardComponent } from './dashboard/shared-dashboard.component';
import { HomeComponent } from './home/home.component';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { managerHrGuard } from './guards/manager-hr.guard';

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
    path: 'dashboard/employees',
    loadComponent: () => import('./dashboard/employees/employees.component').then(m => m.HREmployeesComponent),
    canActivate: [managerHrGuard]
  },
  {
    path: 'dashboard/leave-approvals',
    loadComponent: () => import('./dashboard/leave-approvals/leave-approvals.component').then(m => m.LeaveApprovalsComponent),
    canActivate: [managerHrGuard]
  },
  {
    path: 'admin/leave-policy',
    loadComponent: () => import('./admin/leave-policy/leave-policy.component').then(m => m.LeavePolicyComponent),
    canActivate: [adminGuard]
  },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
