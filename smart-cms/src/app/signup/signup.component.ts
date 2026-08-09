import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService, RegisterRequest } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { DepartmentService, Department } from '../services/department.service';
import { DesignationService, Designation } from '../services/designation.service';
import { ManagerService, Manager } from '../services/manager.service';
import { PayrollService, SalaryTemplate } from '../services/payroll.service';
import { EmailVerificationModalComponent } from '../components/email-verification-modal.component';
import { ConfirmationModalService } from '../shared/confirmation-modal.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, EmailVerificationModalComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent implements OnInit {
  registrationForm!: FormGroup;
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  phone: string = '';
  password: string = '';
  employeeId: string = '';
  department: string = '';
  designation: string = '';
  joiningDate: string = '';
  employmentType: string = '';
  errors: { [key: string]: string } = {};
  isLoading: boolean = false;
  showPassword: boolean = false;
  showVerificationModal: boolean = false;
  pendingFormData: RegisterRequest | null = null;
  isAdminRegistering: boolean = false;

  dbDepartments: Department[] = [];
  dbDesignations: Designation[] = [];
  dbManagers: { _id: string; name: string; email: string }[] = [];
  activeManagers: Manager[] = [];
  dbSalaryTemplates: SalaryTemplate[] = [];
  standardWorkHours: number = 8;
  shiftTimeOptions: { value: string; label: string }[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private managerService: ManagerService,
    private confirmationModal: ConfirmationModalService,
    private payrollService: PayrollService
  ) { }

  ngOnInit(): void {
    this.forceDarkMode();
    this.initializeForm();
    this.loadDepartments();
    this.loadDesignations();
    this.loadManagers();
    this.loadSalaryTemplates();
    this.loadPayrollSettings();

    // Removed conditional fields logic for simplicity

    // Watch for date of birth changes to calculate age
    this.registrationForm.get('dateOfBirth')?.valueChanges.subscribe(() => {
      this.calculateAge();
    });

    this.registrationForm.get('department')?.valueChanges.subscribe(() => {
      this.onDepartmentChange();
    });

    this.registrationForm.get('shiftType')?.valueChanges.subscribe(() => {
      this.onShiftTypeChange();
    });

    this.registrationForm.get('workingHoursStart')?.valueChanges.subscribe(() => {
      this.calculateEndTime();
    });
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

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data) => {
        this.dbDepartments = data;
      },
      error: (error) => {
        console.error('Error fetching departments:', error);
      }
    });
  }

  loadDesignations() {
    this.designationService.getDesignations().subscribe({
      next: (data) => {
        this.dbDesignations = data;
      },
      error: (error) => {
        console.error('Error fetching designations:', error);
      }
    });
  }

  loadManagers() {
    this.managerService.getActiveManagers().subscribe({
      next: (data) => {
        this.activeManagers = data;
        this.dbManagers = data.map(m => ({ _id: m._id, name: m.name, email: m.email }));
      },
      error: (error) => {
        console.error('Signup: Error fetching managers:', error);
      }
    });
  }

  loadSalaryTemplates() {
    this.payrollService.getTemplates().subscribe({
      next: (data) => this.dbSalaryTemplates = data,
      error: (error) => console.error('Error fetching templates', error)
    });
  }

  loadPayrollSettings() {
    this.payrollService.getPayrollSettings().subscribe({
      next: (data) => {
        if (data?.payrollSettings?.overtimeRules?.standardWorkHoursPerDay) {
          this.standardWorkHours = data.payrollSettings.overtimeRules.standardWorkHoursPerDay;
        }
      },
      error: (error) => console.error('Error fetching payroll settings', error)
    });
  }

  onShiftTypeChange() {
    const shiftType = this.registrationForm.get('shiftType')?.value;
    this.registrationForm.patchValue({ workingHoursStart: '', workingHoursEnd: '' });
    
    if (shiftType === 'day') {
      this.shiftTimeOptions = [
        { value: '09:00', label: '9:00 AM - ' + this.calculateEndTimeLabel('09:00') },
        { value: '10:00', label: '10:00 AM - ' + this.calculateEndTimeLabel('10:00') },
        { value: '11:00', label: '11:00 AM - ' + this.calculateEndTimeLabel('11:00') }
      ];
    } else if (shiftType === 'night') {
      this.shiftTimeOptions = [
        { value: '20:00', label: '8:00 PM - ' + this.calculateEndTimeLabel('20:00') },
        { value: '21:00', label: '9:00 PM - ' + this.calculateEndTimeLabel('21:00') },
        { value: '22:00', label: '10:00 PM - ' + this.calculateEndTimeLabel('22:00') }
      ];
    } else {
      this.shiftTimeOptions = [];
    }
  }

  calculateEndTimeLabel(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = (hours + this.standardWorkHours) % 24;
    const period = endHour >= 12 ? 'PM' : 'AM';
    const displayHour = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  calculateEndTime() {
    const startTime = this.registrationForm.get('workingHoursStart')?.value;
    if (!startTime) return;

    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = hours + this.standardWorkHours;
    const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    this.registrationForm.patchValue({ workingHoursEnd: endTime }, { emitEvent: false });
  }

  onDepartmentChange() {
    const department = this.registrationForm.get('department')?.value;
    if (department) {
      this.loadManagersByDepartment(department);
    }
  }

  loadManagersByDepartment(department: string) {
    this.managerService.getActiveManagers(department).subscribe({
      next: (data) => {
        this.activeManagers = data;
        this.dbManagers = data.map(m => ({ _id: m._id, name: m.name, email: m.email }));
        const currentManager = this.registrationForm.get('reportingManager')?.value;
        if (currentManager && !data.find(m => m._id === currentManager)) {
          this.registrationForm.patchValue({ reportingManager: '' });
        }
      },
      error: (error) => {
        console.error('Signup: Error fetching managers:', error);
      }
    });
  }

  validateField(fieldName: string): void {
    delete this.errors[fieldName];
  }

  initializeForm(): void {
    this.registrationForm = this.fb.group({
      // Personal Details
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      age: [{ value: '', disabled: true }], // Auto-calculated, read-only
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      emergencyContactName: ['', Validators.required],
      emergencyContactNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],

      // Professional Details
      employeeId: [{ value: 'TO BE GENERATED', disabled: false }],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      reportingManager: [''],
      joiningDate: ['', Validators.required],
      employmentType: ['', Validators.required],
      workLocation: ['', Validators.required],
      shiftType: [''],

      // Work & Pay Details
      salaryTemplate: [''],
      workingHoursStart: [''],
      workingHoursEnd: [''],
      weeklyWorkingDays: [5, [Validators.min(1), Validators.max(7)]],
      bankAccountNumber: [''],
      bankName: [''],
      bankIFSC: [''],

      // Maternity & Flexible Hours
      maternityEligible: [false],
      flexibleWorkingHours: [false],



      // Authentication
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  updateConditionalFields(): void {
    // No conditional fields to update
  }

  calculateAge(): void {
    const dobValue = this.registrationForm.get('dateOfBirth')?.value;
    if (!dobValue) {
      this.registrationForm.patchValue({ age: '' });
      return;
    }

    const dob = new Date(dobValue);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    this.registrationForm.patchValue({ age: age > 0 ? age : '' });
  }

  getFieldError(fieldName: string): string {
    const field = this.registrationForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors?.['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors?.['pattern']) {
        if (fieldName.includes('phone') || fieldName.includes('Contact') || fieldName.includes('Number')) {
          return 'Must be 10 digits';
        }
        if (fieldName === 'email') {
          return 'Please enter a valid email';
        }
      }
      if (field.errors?.['min']) {
        return `Value must be at least ${field.errors['min'].min}`;
      }
      if (field.errors?.['max']) {
        return `Value must be at most ${field.errors['max'].max}`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      middleName: 'Middle Name',
      gender: 'Gender',
      dateOfBirth: 'Date of Birth',
      maritalStatus: 'Marital Status',
      phone: 'Phone Number',
      email: 'Email',
      currentAddress: 'Current Address',
      permanentAddress: 'Permanent Address',
      emergencyContactName: 'Emergency Contact Name',
      emergencyContactNumber: 'Emergency Contact Number',
      fatherGuardianName: 'Father/Guardian Name',
      guardianContact: 'Guardian Contact',
      spouseName: 'Spouse Name',
      spouseContactNumber: 'Spouse Contact Number',
      employeeId: 'Employee ID',
      department: 'Department',
      designation: 'Designation',
      joiningDate: 'Date of Joining',
      employmentType: 'Employment Type',
      workLocation: 'Work Location',
      password: 'Password'
    };
    return labels[fieldName] || fieldName;
  }

  validateForm(): boolean {
    if (this.registrationForm.invalid) {
      // Mark all fields as touched to show errors
      Object.keys(this.registrationForm.controls).forEach(key => {
        const control = this.registrationForm.get(key);
        control?.markAsTouched();
      });
      return false;
    }
    return true;
  }

  onSubmit(): void {
    if (this.isLoading || !this.validateForm()) {
      return;
    }

    const formValue = this.registrationForm.getRawValue();

    // Prepare registration data
    const registrationData: RegisterRequest = {
      // Personal Details
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      gender: formValue.gender,
      dateOfBirth: formValue.dateOfBirth,
      age: formValue.age || 0,
      phone: formValue.phone.trim(),
      email: formValue.email.trim().toLowerCase(),
      currentAddress: 'Not Provided',
      permanentAddress: 'Not Provided',
      emergencyContactName: formValue.emergencyContactName.trim(),
      emergencyContactNumber: formValue.emergencyContactNumber.trim(),

      // Professional Details
      employeeId: formValue.employeeId.trim().toUpperCase(),
      department: formValue.department,
      designation: formValue.designation.trim(),
      reportingManager: formValue.reportingManager ? String(formValue.reportingManager).trim() : undefined,
      joiningDate: formValue.joiningDate,
      employmentType: formValue.employmentType,
      workLocation: formValue.workLocation.trim(),
      shiftType: formValue.shiftType || undefined,

      // Work & Pay Details
      workingHoursStart: formValue.workingHoursStart || undefined,
      workingHoursEnd: formValue.workingHoursEnd || undefined,
      weeklyWorkingDays: formValue.weeklyWorkingDays || 5,
      wageType: formValue.wageType || undefined,
      salaryAmount: formValue.salaryAmount ? Number(formValue.salaryAmount) : undefined,
      allowances: formValue.allowances ? Number(formValue.allowances) : 0,
      overtimeEligible: formValue.overtimeEligible || false,
      bankAccountNumber: formValue.bankAccountNumber?.trim() || undefined,
      bankName: formValue.bankName?.trim() || undefined,
      bankIFSC: formValue.bankIFSC?.trim() || undefined,
      pfApplicable: formValue.pfApplicable || false,
      esicApplicable: formValue.esicApplicable || false,

      // Maternity & Flexible Hours
      maternityEligible: formValue.maternityEligible || false,
      flexibleWorkingHours: formValue.flexibleWorkingHours || false,

      // Phase 2: Pregnancy tracking (removed from UI, relying on defaults)
      pregnancyStatus: 'Not Pregnant',

      // Authentication
      // Authentication
      password: formValue.password
    };

    // Check if admin is registering
    const isAdminRegistering = typeof window !== 'undefined' && sessionStorage.getItem('adminRegistering') === 'true';

    if (isAdminRegistering) {
      // Bypass OTP for admin
      this.registerUser(registrationData);
    } else {
      // Normal flow with OTP
      this.pendingFormData = registrationData;
      this.showVerificationModal = true;
    }
  }

  onEmailVerified(otp: string): void {
    if (!this.pendingFormData) {
      return;
    }
    this.showVerificationModal = false;
    this.registerUser(this.pendingFormData);
  }

  private registerUser(data: any): void {
    this.isLoading = true;
    const isAdminRegistering = typeof window !== 'undefined' && sessionStorage.getItem('adminRegistering') === 'true';

    this.authService.register(data).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Registration successful:', response);

        // Clear the admin registering flag
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('adminRegistering');
        }

        // If admin was registering, redirect to admin dashboard
        const msg = 'Profile created successfully! Employee ID: ' + response.user.employeeId;
        this.confirmationModal.alert('Success', msg, 'success').then(() => {
          if (isAdminRegistering) {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/login']);
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        if (error.error && error.error.message) {
          this.errors['general'] = error.error.message;
        } else {
          this.errors['general'] = 'Registration failed. Please try again.';
        }
        // If it was a normal user registration that failed after OTP, we might want to show modal again?
        // But if it failed due to backend error (e.g. email exists), showing modal again might not be useful without form edit.
        // For now, let's just keep the error display.
        if (!isAdminRegistering) {
          this.showVerificationModal = true;
        }
      }
    });
  }

  onModalClosed(): void {
    this.showVerificationModal = false;
    this.pendingFormData = null;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onPhoneInput(event: Event, fieldName: string): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    this.registrationForm.patchValue({ [fieldName]: value });
  }

  // Helper methods for conditional rendering
  isFemale(): boolean {
    return this.registrationForm.get('gender')?.value === 'Female';
  }

  isMarriedFemale(): boolean {
    return this.isFemale() && this.registrationForm.get('maritalStatus')?.value === 'Married';
  }

  isUnmarriedFemale(): boolean {
    return this.isFemale() && this.registrationForm.get('maritalStatus')?.value === 'Single';
  }

  isOtherGender(): boolean {
    return this.registrationForm.get('gender')?.value === 'Other';
  }

  shouldShowMaritalStatus(): boolean {
    return this.isFemale();
  }
}
