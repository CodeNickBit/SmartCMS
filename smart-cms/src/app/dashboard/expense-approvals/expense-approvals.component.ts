import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService, Expense } from '../../services/expense.service';

@Component({
  selector: 'app-expense-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-approvals.component.html',
  styleUrls: ['./expense-approvals.component.css']
})
export class ExpenseApprovalsComponent implements OnInit {
  expenses: Expense[] = [];
  
  showRejectModal = false;
  selectedExpenseId: string = '';
  rejectionReason: string = '';

  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses() {
    this.expenseService.getAllExpenses().subscribe({
      next: (data: any) => this.expenses = data,
      error: (err: any) => console.error('Error fetching all expenses', err)
    });
  }

  approveExpense(id: string) {
    this.expenseService.updateExpenseStatus(id, 'Approved').subscribe({
      next: () => this.loadExpenses(),
      error: (err: any) => alert(err.error?.message || 'Error approving expense')
    });
  }

  markReimbursed(id: string) {
    this.expenseService.updateExpenseStatus(id, 'Reimbursed').subscribe({
      next: () => this.loadExpenses(),
      error: (err: any) => alert(err.error?.message || 'Error reimbursing expense')
    });
  }

  openRejectModal(id: string) {
    this.selectedExpenseId = id;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.selectedExpenseId = '';
  }

  rejectExpense() {
    if (!this.rejectionReason) return;
    this.expenseService.updateExpenseStatus(this.selectedExpenseId, 'Rejected', this.rejectionReason).subscribe({
      next: () => {
        this.loadExpenses();
        this.closeRejectModal();
      },
      error: (err: any) => alert(err.error?.message || 'Error rejecting expense')
    });
  }
}
