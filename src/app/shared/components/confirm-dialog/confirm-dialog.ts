import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-box">
      <div class="icon-wrap" [class.warn]="data.confirmColor === 'warn'">
        <mat-icon>warning_rounded</mat-icon>
      </div>
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="center">
        <button mat-button class="btn-cancel" [mat-dialog-close]="false">{{ data.cancelText || 'Cancelar' }}</button>
        <button mat-flat-button class="btn-confirm" [class.warn]="data.confirmColor === 'warn'" [mat-dialog-close]="true">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-box {
      text-align: center;
      padding: 32px 24px 16px;
    }
    .icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    .icon-wrap.warn {
      background: #e8e8e8;
    }
    .icon-wrap mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #666;
    }
    .icon-wrap.warn mat-icon {
      color: #1a1a1a;
    }
    h2 {
      margin: 0 0 8px;
      font-weight: 700;
      font-size: 18px;
      color: #1a1a1a;
    }
    mat-dialog-content {
      padding: 0 !important;
    }
    p {
      margin: 0;
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      white-space: pre-line;
    }
    mat-dialog-actions {
      padding: 24px 0 0 !important;
      gap: 10px;
    }
    .btn-cancel {
      flex: 1;
      font-weight: 600;
      border-radius: 8px;
      border: 1px solid #d0d0d0 !important;
      color: #1a1a1a !important;
    }
    .btn-confirm {
      flex: 1;
      border-radius: 8px !important;
      background: #1a1a1a !important;
      font-weight: 600;
    }
    ::ng-deep .btn-confirm .mdc-button__label,
    ::ng-deep .btn-confirm .mat-mdc-button-persistent-affix {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px;
      color: white !important;
    }
    ::ng-deep .btn-confirm .mdc-button__label mat-icon,
    ::ng-deep .btn-confirm .mat-mdc-button-persistent-affix mat-icon {
      color: white !important;
    }
  `],
})
export class ConfirmDialog {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}

export function injectConfirmDialog() {
  const dialog = inject(MatDialog);
  return (data: ConfirmDialogData): Promise<boolean> => {
    const ref = dialog.open(ConfirmDialog, { width: '400px', data });
    return ref.afterClosed().toPromise() as Promise<boolean>;
  };
}
