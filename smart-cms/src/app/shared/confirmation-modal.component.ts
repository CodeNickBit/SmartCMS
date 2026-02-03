import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationModalService, ConfirmationConfig } from './confirmation-modal.service';

@Component({
    selector: 'app-confirmation-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" (click)="onCancel()"></div>
      <div class="relative bg-[#1B264F] border border-blue-900/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-blue-900/50 bg-[#101935]/50 flex items-center gap-3">
          <div class="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
            [ngClass]="{
              'bg-blue-500/20 text-blue-400': config?.type === 'info',
              'bg-emerald-500/20 text-emerald-400': config?.type === 'success',
              'bg-amber-500/20 text-amber-400': config?.type === 'warning',
              'bg-rose-500/20 text-rose-400': config?.type === 'error'
            }">
            <!-- Info Icon -->
            <svg *ngIf="config?.type === 'info'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <!-- Success Icon -->
            <svg *ngIf="config?.type === 'success'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <!-- Warning Icon -->
            <svg *ngIf="config?.type === 'warning'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <!-- Error Icon -->
            <svg *ngIf="config?.type === 'error'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-white">{{ config?.title }}</h3>
        </div>

        <!-- Body -->
        <div class="px-6 py-5">
          <p class="text-slate-300 leading-relaxed">{{ config?.message }}</p>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-[#101935]/30 border-t border-blue-900/50 flex justify-end gap-3">
          <button *ngIf="config?.cancelText" (click)="onCancel()"
            class="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5 transition-all font-medium">
            {{ config?.cancelText }}
          </button>
          <button (click)="onConfirm()"
            class="px-4 py-2 rounded-lg font-bold transition-all"
            [ngClass]="{
              'bg-blue-600 hover:bg-blue-500 text-white': config?.type === 'info',
              'bg-emerald-600 hover:bg-emerald-500 text-white': config?.type === 'success',
              'bg-amber-600 hover:bg-amber-500 text-white': config?.type === 'warning',
              'bg-rose-600 hover:bg-rose-500 text-white': config?.type === 'error'
            }">
            {{ config?.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    @keyframes fade-in-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fade-in-up {
      animation: fade-in-up 0.3s ease-out;
    }
  `]
})
export class ConfirmationModalComponent implements OnInit {
    showModal = false;
    config: ConfirmationConfig | null = null;

    constructor(private modalService: ConfirmationModalService) { }

    ngOnInit(): void {
        this.modalService.showModal$.subscribe(show => {
            this.showModal = show;
        });

        this.modalService.config$.subscribe(config => {
            this.config = config;
        });
    }

    onConfirm(): void {
        this.modalService.handleConfirm();
    }

    onCancel(): void {
        this.modalService.handleCancel();
    }
}
