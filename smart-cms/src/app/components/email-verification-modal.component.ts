import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-email-verification-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './email-verification-modal.component.html',
  styleUrl: './email-verification-modal.component.css'
})
export class EmailVerificationModalComponent {
  @Input() email: string = '';
  @Output() verified = new EventEmitter<string>(); // Emit OTP when verified
  @Output() closed = new EventEmitter<void>();

  currentStep: number = 1;
  otp: string = '';
  isSendingEmail: boolean = false;
  isVerifying: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: AuthService) {}

  sendOTP() {
    if (!this.email) {
      this.errorMessage = 'Email is required';
      return;
    }

    this.isSendingEmail = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.sendOTP(this.email).subscribe({
      next: (response) => {
        this.isSendingEmail = false;
        this.successMessage = 'OTP sent successfully to your email';
        this.currentStep = 2;
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.isSendingEmail = false;
        this.errorMessage = error.error?.message || 'Failed to send OTP. Please try again.';
      }
    });
  }

  verifyOTP() {
    if (!this.otp || this.otp.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit OTP';
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';

    this.authService.verifyOTP(this.email, this.otp).subscribe({
      next: (response) => {
        this.isVerifying = false;
        this.verified.emit(this.otp); // Emit the OTP to parent
      },
      error: (error) => {
        this.isVerifying = false;
        this.errorMessage = error.error?.message || 'Invalid OTP. Please try again.';
      }
    });
  }

  closeModal() {
    this.closed.emit();
  }

  onOtpInput(event: any) {
    const value = event.target.value.replace(/\D/g, '').slice(0, 6);
    this.otp = value;
    this.errorMessage = '';
  }
}

