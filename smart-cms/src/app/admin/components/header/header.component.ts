import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class AdminHeaderComponent {
  @Input() title: string = 'Admin Dashboard';
  @Input() searchQuery: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();

  onSearchChange(value: string) {
    this.searchQuery = value;
    this.searchQueryChange.emit(value);
  }
}
