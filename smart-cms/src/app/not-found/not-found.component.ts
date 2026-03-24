import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './not-found.component.html'
})
export class NotFoundComponent implements OnInit {
  ngOnInit() {
    this.forceDarkMode();
  }

  private forceDarkMode(): void {
    if (typeof document !== 'undefined') {
      const body = document.body;
      const html = document.documentElement;
      body.classList.remove('theme-light');
      html.classList.remove('theme-light');
      body.classList.add('dark');
      html.classList.add('dark');
    }
  }
}
