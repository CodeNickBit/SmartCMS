import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService, RegisterRequest } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { DepartmentService, Department } from '../services/department.service';
import { DesignationService, Designation } from '../services/designation.service';
import { ManagerService, Manager } from '../services/manager.service';
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

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private managerService: ManagerService,
    private confirmationModal: ConfirmationModalService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDepartments();
    this.loadDesignations();
    this.loadManagers();

    // Watch for gender and marital status changes to show/hide conditional fields
    this.registrationForm.get('gender')?.valueChanges.subscribe(() => {
      this.updateConditionalFields();
    });

    this.registrationForm.get('maritalStatus')?.valueChanges.subscribe(() => {
      this.updateConditionalFields();
    });

    // Watch for date of birth changes to calculate age
    this.registrationForm.get('dateOfBirth')?.valueChanges.subscribe(() => {
      this.calculateAge();
    });

    this.registrationForm.get('department')?.valueChanges.subscribe(() => {
      this.onDepartmentChange();
    });
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
    console.log('Signup: Loading all active managers...');
    this.managerService.getActiveManagers().subscribe({
      next: (data) => {
        console.log('Signup: Managers loaded:', data);
        this.activeManagers = data;
      },
      error: (error) => {
        console.error('Signup: Error fetching managers:', error);
      }
    });
  }

  onDepartmentChange() {
    const department = this.registrationForm.get('department')?.value;
    console.log('Signup: Department changed to:', department);
    if (department) {
      this.loadManagersByDepartment(department);
    }
  }

  loadManagersByDepartment(department: string) {
    console.log('Signup: Loading managers for department:', department);
    this.managerService.getActiveManagers(department).subscribe({
      next: (data) => {
        console.log('Signup: Filtered managers:', data);
        this.activeManagers = data;
        const currentManager = this.registrationForm.get('reportingManager')?.value;
        if (currentManager && !data.find(m => m.name === currentManager)) {
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
      middleName: [''],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      age: [{ value: '', disabled: true }],
      maritalStatus: [''],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      currentAddress: ['', Validators.required],
      permanentAddress: ['', Validators.required],
      emergencyContactName: ['', Validators.required],
      emergencyContactNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],

      // Gender-based conditional fields
      fatherGuardianName: [''],
      guardianContact: [''],
      spouseName: [''],
      spouseContactNumber: [''],
      marriageDate: [''],
      preferredName: [''],
      pronouns: [''],

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
      workingHoursStart: [''],
      workingHoursEnd: [''],
      weeklyWorkingDays: [5, [Validators.min(1), Validators.max(7)]],
      wageType: [''],
      salaryAmount: ['', [Validators.min(0)]],
      allowances: [0, [Validators.min(0)]],
      overtimeEligible: [false],
      bankAccountNumber: [''],
      bankName: [''],
      bankIFSC: [''],
      pfApplicable: [false],
      esicApplicable: [false],

      // Maternity & Flexible Hours
      maternityEligible: [false],
      flexibleWorkingHours: [false],

      // Phase 2: Pregnancy tracking
      pregnancyStatus: ['Not Pregnant'],
      expectedDeliveryDate: [''],
      medicalFitnessCertificate: [''],

      // Authentication
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  updateConditionalFields(): void {
    const gender = this.registrationForm.get('gender')?.value;
    const maritalStatus = this.registrationForm.get('maritalStatus')?.value;

    // Reset conditional field validators
    const fatherGuardianName = this.registrationForm.get('fatherGuardianName');
    const guardianContact = this.registrationForm.get('guardianContact');
    const spouseName = this.registrationForm.get('spouseName');
    const spouseContactNumber = this.registrationForm.get('spouseContactNumber');
    const marriageDate = this.registrationForm.get('marriageDate');
    const preferredName = this.registrationForm.get('preferredName');
    const pronouns = this.registrationForm.get('pronouns');

    // Clear validators first
    [fatherGuardianName, guardianContact, spouseName, spouseContactNumber, marriageDate, preferredName, pronouns].forEach(control => {
      control?.clearValidators();
      control?.updateValueAndValidity();
    });

    // Unmarried Female
    if (gender === 'Female' && maritalStatus === 'Single') {
      fatherGuardianName?.setValidators([Validators.required]);
      guardianContact?.setValidators([Validators.required, Validators.pattern(/^\d{10}$/)]);
      fatherGuardianName?.updateValueAndValidity();
      guardianContact?.updateValueAndValidity();
    }

    // Married Female
    if (gender === 'Female' && maritalStatus === 'Married') {
      spouseName?.setValidators([Validators.required]);
      spouseContactNumber?.setValidators([Validators.required, Validators.pattern(/^\d{10}$/)]);
      spouseName?.updateValueAndValidity();
      spouseContactNumber?.updateValueAndValidity();
    }

    // Other/Prefer Not to Say
    if (gender === 'Other') {
      // Optional fields, no required validators
    }
  }

  calculateAge(): void {
    const dateOfBirth = this.registrationForm.get('dateOfBirth')?.value;
    if (dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      this.registrationForm.patchValue({ age }, { emitEvent: false });
    }
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
      middleName: formValue.middleName?.trim() || undefined,
      lastName: formValue.lastName.trim(),
      gender: formValue.gender,
      dateOfBirth: formValue.dateOfBirth,
      maritalStatus: formValue.maritalStatus || undefined,
      phone: formValue.phone.trim(),
      email: formValue.email.trim().toLowerCase(),
      currentAddress: formValue.currentAddress.trim(),
      permanentAddress: formValue.permanentAddress.trim(),
      emergencyContactName: formValue.emergencyContactName.trim(),
      emergencyContactNumber: formValue.emergencyContactNumber.trim(),

      // Gender-based conditional fields
      fatherGuardianName: formValue.fatherGuardianName?.trim() || undefined,
      guardianContact: formValue.guardianContact?.trim() || undefined,
      spouseName: formValue.spouseName?.trim() || undefined,
      spouseContactNumber: formValue.spouseContactNumber?.trim() || undefined,
      marriageDate: formValue.marriageDate || undefined,
      preferredName: formValue.preferredName?.trim() || undefined,
      pronouns: formValue.pronouns?.trim() || undefined,

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

      // Phase 2: Pregnancy tracking
      pregnancyStatus: formValue.pregnancyStatus || 'Not Pregnant',
      expectedDeliveryDate: formValue.expectedDeliveryDate || undefined,
      medicalFitnessCertificate: formValue.medicalFitnessCertificate?.trim() || undefined,

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
