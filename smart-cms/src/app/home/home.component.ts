import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  userName: string = 'User';
  currentDate: Date = new Date();

  quickActions = [
    { icon: 'users', title: 'Team', description: 'Manage team members', color: '#3083DC' },
    { icon: 'folder', title: 'Projects', description: 'View all projects', color: '#10B981' },
    { icon: 'chart', title: 'Analytics', description: 'Performance metrics', color: '#8B5CF6' },
    { icon: 'settings', title: 'Settings', description: 'System preferences', color: '#EE964B' }
  ];

  recentActivities = [
    { action: 'Project created', item: 'Marketing Campaign Q1', time: '2 hours ago' },
    { action: 'Document uploaded', item: 'Annual Report 2024', time: '5 hours ago' },
    { action: 'Team member added', item: 'John Smith', time: '1 day ago' }
  ];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user && user.firstName) {
      this.userName = user.firstName;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
