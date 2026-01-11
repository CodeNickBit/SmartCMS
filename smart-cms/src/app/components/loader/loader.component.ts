import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loaderService.loading$ | async" class="fixed inset-0 z-[9999] flex items-center justify-center bg-[#101935] bg-opacity-95 backdrop-blur-md transition-opacity duration-300">
      <div class="flex flex-col items-center gap-8">
        <!-- Minimal Elegant Loader -->
        <div class="relative h-20 w-20">
          <!-- Pulse Effect -->
          <div class="absolute inset-0 rounded-full bg-[#EE964B] opacity-20 animate-ping"></div>
          
          <!-- Outer Ring -->
          <div class="absolute inset-0 rounded-full border-4 border-[#3083DC]/20"></div>
          
          <!-- Spinning Arc -->
          <div class="absolute inset-0 rounded-full border-4 border-t-[#EE964B] border-r-transparent border-b-transparent border-l-transparent animate-spin-slow"></div>
          
          <!-- Inner Circle -->
          <div class="absolute inset-4 rounded-full bg-[#1B264F] shadow-inner flex items-center justify-center">
             <div class="h-3 w-3 bg-[#EE964B] rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div class="flex flex-col items-center gap-2">
          <div class="text-white text-lg font-bold tracking-[0.3em] font-sans">LOADING</div>
           <!-- Thin Progress Line -->
          <div class="h-0.5 w-24 bg-blue-900/50 rounded-full overflow-hidden">
            <div class="h-full bg-[#EE964B] animate-progress"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin-slow {
      animation: spin 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes progress {
      0% { width: 0%; transform: translateX(-100%); }
      50% { width: 70%; }
      100% { width: 100%; transform: translateX(100%); }
    }
  `]
})
export class LoaderComponent {
  constructor(public loaderService: LoaderService) { }
}
