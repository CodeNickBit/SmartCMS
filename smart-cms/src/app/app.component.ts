import { Component } from '@angular/core';
import { Router, RouterModule, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { LoaderComponent } from './components/loader/loader.component';
import { LoaderService } from './services/loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'smart-cms';

  private timeoutId: any;

  constructor(private router: Router, private loaderService: LoaderService) {
    // Show loader immediately on app load to prevent potential flash
    this.loaderService.show();

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Cancel any pending hide operation to prevent race conditions
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
        this.loaderService.show();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // Keep a slightly shorter delay to be snappy but smooth
        this.timeoutId = setTimeout(() => {
          this.loaderService.hide();
          this.timeoutId = null;
        }, 500);
      }
    });
  }
}
