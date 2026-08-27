import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExpenseService, Expense } from '../../services/expense.service';
import { CompanySettingsService } from '../../services/company-settings.service';


import { SharedSidebarComponent } from '../components/sidebar/sidebar.component';
import { SharedHeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-my-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedSidebarComponent, SharedHeaderComponent],
  templateUrl: './my-expenses.component.html',
  styleUrls: ['./my-expenses.component.css']
})
export class MyExpensesComponent implements OnInit {
  expenses: Expense[] = [];
  categories: string[] = ['Travel', 'Food', 'Accommodation', 'Internet', 'Office Supplies', 'Other'];
  
  showModal = false;
  expenseForm: FormGroup;
  selectedFile: File | null = null;

  constructor(
    private expenseService: ExpenseService,
    private settingsService: CompanySettingsService,
    private fb: FormBuilder
  ) {
    this.expenseForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      currency: ['USD'],
      category: ['Travel', Validators.required],
      expenseDate: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadExpenses();
    this.loadCategories();
  }

  loadExpenses() {
    this.expenseService.getMyExpenses().subscribe({
      next: (data: any) => this.expenses = data,
      error: (err: any) => console.error('Error fetching expenses', err)
    });
  }

  loadCategories() {
    this.settingsService.getSettings().subscribe({
      next: (settings: any) => {
        if (settings && settings.expenseCategories && settings.expenseCategories.length > 0) {
          this.categories = settings.expenseCategories;
        }
      },
      error: (err: any) => console.error('Error fetching settings', err)
    });
  }

  openAddModal() {
    this.expenseForm.reset({ category: this.categories[0], currency: 'USD' });
    this.selectedFile = null;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onSubmit() {
    if (this.expenseForm.invalid) return;

    const formData = new FormData();
    Object.keys(this.expenseForm.value).forEach(key => {
      formData.append(key, this.expenseForm.value[key]);
    });

    if (this.selectedFile) {
      formData.append('receipt', this.selectedFile);
    }

    this.expenseService.submitExpense(formData).subscribe({
      next: () => {
        this.loadExpenses();
        this.closeModal();
      },
      error: (err: any) => alert(err.error?.message || 'Error submitting expense')
    });
  }

  deleteExpense(id: string) {
    if(confirm('Are you sure you want to delete this pending claim?')) {
      this.expenseService.deleteExpense(id).subscribe({
        next: () => this.loadExpenses(),
        error: (err: any) => alert(err.error?.message || 'Error deleting expense')
      });
    }
  }
}
