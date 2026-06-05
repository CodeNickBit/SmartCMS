import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';
import { SharedSidebarComponent } from '../../dashboard/components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../../dashboard/components/header/header.component';
@Component({
  selector: 'app-employee-workflow',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, AdminHeaderComponent, SharedSidebarComponent, SharedHeaderComponent],
  templateUrl: './employee-workflow.component.html',
  styleUrls: ['./employee-workflow.component.css']
})
export class EmployeeWorkflowComponent implements OnInit {
  userId: string = '';
  user: any = null;
  tasks: any[] = [];
  loading: boolean = true;
  userRole: string = 'admin';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getUser();
    if (currentUser) {
      this.userRole = currentUser.role || 'admin';
    }

    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUserAndTasks();
    }
  }

  loadUserAndTasks(): void {
    this.authService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loadTasks();
      },
      error: () => this.loading = false
    });
  }

  loadTasks(): void {
    this.taskService.getWorkflowTasks(this.userId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  updateTaskStatus(task: any, newStatus: string): void {
    if (!this.canEditTask(task)) {
      alert('You do not have permission to update this task.');
      return;
    }
    this.taskService.updateStatus(task._id, newStatus).subscribe({
      next: () => {
        task.status = newStatus;
      },
      error: () => alert('Error updating task status')
    });
  }

  canEditTask(task: any): boolean {
    if (this.userRole === 'admin') return true;
    if (this.userRole === 'hr' && task.assignedToModel === 'Hr') return true;
    if (this.userRole === 'manager' && (task.assignedToModel === 'Manager' || task.assignedToModel === 'Reporting_Manager')) return true;
    // Assuming currentUser ID is available, but role check is sufficient for now
    return false;
  }
  
  goBack(): void {
    if (this.userRole === 'admin') {
      this.router.navigate(['/admin/manage-employee']);
    } else if (this.userRole === 'manager') {
      this.router.navigate(['/dashboard/my-team']);
    } else if (this.userRole === 'hr') {
      this.router.navigate(['/dashboard/employees']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
