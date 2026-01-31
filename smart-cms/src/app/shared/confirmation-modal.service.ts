import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmationConfig {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
}

@Injectable({
    providedIn: 'root'
})
export class ConfirmationModalService {
    private showModalSubject = new BehaviorSubject<boolean>(false);
    private configSubject = new BehaviorSubject<ConfirmationConfig | null>(null);
    private resolveCallback: ((value: boolean) => void) | null = null;

    showModal$ = this.showModalSubject.asObservable();
    config$ = this.configSubject.asObservable();

    confirm(config: ConfirmationConfig): Promise<boolean> {
        this.configSubject.next({
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            type: 'info',
            ...config
        });
        this.showModalSubject.next(true);

        return new Promise((resolve) => {
            this.resolveCallback = resolve;
        });
    }

    alert(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<boolean> {
        return this.confirm({
            title,
            message,
            confirmText: 'OK',
            cancelText: '',
            type
        });
    }

    handleConfirm(): void {
        this.showModalSubject.next(false);
        if (this.resolveCallback) {
            this.resolveCallback(true);
            this.resolveCallback = null;
        }
    }

    handleCancel(): void {
        this.showModalSubject.next(false);
        if (this.resolveCallback) {
            this.resolveCallback(false);
            this.resolveCallback = null;
        }
    }
}
