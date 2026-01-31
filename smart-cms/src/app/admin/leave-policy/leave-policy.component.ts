import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { LeavePolicyService, LeavePolicy } from '../../services/leave-policy.service';

import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { AdminHeaderComponent } from '../components/header/header.component';

@Component({
    selector: 'app-leave-policy',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminSidebarComponent, AdminHeaderComponent],
    templateUrl: './leave-policy.component.html',
    styleUrls: ['./leave-policy.component.css']
})
export class LeavePolicyComponent implements OnInit {
    policies: LeavePolicy[] = [];
    leaveForm: FormGroup;
    showForm = false;
    isEditing = false;
    currentPolicyId: string | null = null;

    // Settings
    generalRules: string[] = [];
    isEditingSettings = false;
    newRuleText: string = '';

    // Delete Modal
    showDeleteModal = false;
    policyToDeleteId: string | null = null;
    policyToDeleteName: string = '';

    availableRoles = [
        { id: 'employee', label: 'Employee' },
        { id: 'manager', label: 'Manager' },
        { id: 'hr', label: 'HR' }
    ];

    constructor(
        private leavePolicyService: LeavePolicyService,
        private fb: FormBuilder
    ) {
        this.leaveForm = this.fb.group({
            leaveName: ['', Validators.required],
            description: [''],
            allowedRoles: this.fb.array([], Validators.required),
            annualLimit: [0, [Validators.required, Validators.min(0)]],
            minNoticeHours: [0, [Validators.required, Validators.min(0)]],
            isActive: [true]
        });
    }

    ngOnInit(): void {
        this.loadPolicies();
        this.loadSettings();
    }

    loadSettings(): void {
        this.leavePolicyService.getSettings().subscribe({
            next: (settings) => {
                if (settings && settings.generalLeaveRules) {
                    this.generalRules = settings.generalLeaveRules;
                }
            },
            error: (err) => console.error('Error loading settings', err)
        });
    }

    // Settings Methods
    toggleSettingsEdit(): void {
        this.isEditingSettings = !this.isEditingSettings;
        if (!this.isEditingSettings) {
            // Save on close if needed, or just reset. 
            // Here we assume save is explicit via a button or auto-save on change?
            // Let's implement explicit save.
            this.saveSettings();
        }
    }

    addRule(): void {
        if (this.newRuleText.trim()) {
            this.generalRules.push(this.newRuleText.trim());
            this.newRuleText = '';
        }
    }

    removeRule(index: number): void {
        this.generalRules.splice(index, 1);
    }

    saveSettings(): void {
        this.leavePolicyService.updateSettings({ generalLeaveRules: this.generalRules }).subscribe({
            next: (updated) => {
                this.generalRules = updated.generalLeaveRules;
                this.isEditingSettings = false;
            },
            error: (err) => console.error('Error updating settings', err)
        });
    }

    loadPolicies(): void {
        this.leavePolicyService.getPolicies().subscribe({
            next: (data) => {
                this.policies = data;
            },
            error: (err) => console.error('Error fetching policies', err)
        });
    }

    initForm(): void {
        this.showForm = true;
        this.isEditing = false;
        this.currentPolicyId = null;
        this.leaveForm.reset({
            annualLimit: 0,
            isActive: true
        });
        // Reset form array
        const rolesArray = this.leaveForm.get('allowedRoles') as FormArray;
        rolesArray.clear();
    }

    onRoleChange(e: any, roleId: string): void {
        const rolesArray = this.leaveForm.get('allowedRoles') as FormArray;

        if (e.target.checked) {
            rolesArray.push(this.fb.control(roleId));
        } else {
            let i = 0;
            rolesArray.controls.forEach((item: any) => {
                if (item.value == roleId) {
                    rolesArray.removeAt(i);
                    return;
                }
                i++;
            });
        }
    }

    isRoleSelected(roleId: string): boolean {
        const rolesArray = this.leaveForm.get('allowedRoles') as FormArray;
        return rolesArray.value.includes(roleId);
    }

    editPolicy(policy: LeavePolicy): void {
        this.showForm = true;
        this.isEditing = true;
        this.currentPolicyId = policy._id || null; // Handle optional _id

        // Populate form
        this.leaveForm.patchValue({
            leaveName: policy.leaveName,
            description: policy.description,
            annualLimit: policy.annualLimit,
            minNoticeHours: policy.minNoticeHours || 0,
            isActive: policy.isActive
        });

        // Populate roles
        const rolesArray = this.leaveForm.get('allowedRoles') as FormArray;
        rolesArray.clear();
        policy.allowedRoles.forEach(role => {
            rolesArray.push(this.fb.control(role));
        });
    }

    deletePolicy(id: string | undefined, name: string): void {
        if (!id) return;
        this.policyToDeleteId = id;
        this.policyToDeleteName = name;
        this.showDeleteModal = true;
    }

    confirmDelete(): void {
        if (this.policyToDeleteId) {
            this.leavePolicyService.deletePolicy(this.policyToDeleteId).subscribe({
                next: () => {
                    this.loadPolicies();
                    this.closeDeleteModal();
                },
                error: (err) => console.error('Error deleting policy', err)
            });
        }
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.policyToDeleteId = null;
        this.policyToDeleteName = '';
    }

    onSubmit(): void {
        if (this.leaveForm.valid) {
            const policyData = this.leaveForm.value;

            if (this.isEditing && this.currentPolicyId) {
                this.leavePolicyService.updatePolicy(this.currentPolicyId, policyData).subscribe({
                    next: () => {
                        this.loadPolicies();
                        this.showForm = false;
                    },
                    error: (err) => console.error('Error updating policy', err)
                });
            } else {
                this.leavePolicyService.createPolicy(policyData).subscribe({
                    next: () => {
                        this.loadPolicies();
                        this.showForm = false;
                    },
                    error: (err) => console.error('Error creating policy', err)
                });
            }
        } else {
            // Mark all fields as touched to trigger validation messages
            this.leaveForm.markAllAsTouched();
        }
    }

    cancel(): void {
        this.showForm = false;
    }
}
