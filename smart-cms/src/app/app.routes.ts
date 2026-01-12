import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'admin/dashboard',
    component: DashboardComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/add-users',
    loadComponent: () => import('./admin/add-user/add-user.component').then(m => m.AddUserComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-employee',
    loadComponent: () => import('./admin/manage-employee/manage-employee.component').then(m => m.ManageEmployeeComponent),
    canActivate: [adminGuard]
  },
  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
