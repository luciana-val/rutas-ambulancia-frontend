import { Component, inject, signal, computed, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { User, UserRole } from '../../../core/models/user';
import { UserManagementService } from '../../../shared/services/user-management.service';
import { injectConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-user-list',
  imports: [
    MatButtonModule, MatIconModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, FormsModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-row">
        <div>
          <h1 class="page-title">Usuarios</h1>
          <p class="page-subtitle">Gestión de dispatchers y conductores</p>
        </div>
        <button mat-flat-button (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nuevo Usuario
        </button>
      </div>

      <div class="search-bar">
        <mat-icon class="search-icon">search</mat-icon>
        <input
          class="search-input"
          placeholder="Buscar por nombre o usuario..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
        />
        @if (searchQuery()) {
          <button class="clear-btn" (click)="searchQuery.set('')">
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>

      @if (filteredUsers().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">people</mat-icon>
          <p class="empty-title">Sin resultados</p>
          <p class="empty-sub">
            @if (searchQuery()) {
              No hay usuarios que coincidan con "{{ searchQuery() }}"
            } @else {
              No hay usuarios registrados
            }
          </p>
          @if (!searchQuery()) {
            <button mat-stroked-button (click)="openCreateDialog()">Crear primer usuario</button>
          }
        </div>
      } @else {
        <div class="user-grid">
          @for (u of filteredUsers(); track u.id) {
            <div class="user-card" (click)="openEditDialog(u)">
              <div class="card-top">
                <div class="user-avatar">
                  <mat-icon>person</mat-icon>
                </div>
                <div class="card-body">
                  <span class="user-name">{{ u.name }}</span>
                  <span class="user-username">&#64;{{ u.username }}</span>
                  <span class="role-badge role-{{ u.role }}">{{ ROLE_LABELS[u.role] || u.role }}</span>
                </div>
              </div>
              <div class="card-actions">
                <button mat-button (click)="$event.stopPropagation(); openEditDialog(u)">
                  <mat-icon>edit</mat-icon> Editar
                </button>
                <button mat-button class="btn-delete" (click)="$event.stopPropagation(); confirmDelete(u)">
                  <mat-icon>delete</mat-icon> Eliminar
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .header-row {
      display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px;
    }
    .header-row button {
      border-radius: 8px; background: #1a1a1a !important; color: white !important;
    }

    .search-bar {
      display: flex; align-items: center; gap: 8px;
      background: white; border: 1px solid #e0e0e0; border-radius: 10px;
      padding: 0 14px; margin-bottom: 20px; transition: border-color 0.15s;
    }
    .search-bar:focus-within { border-color: #1a1a1a; }
    .search-icon { color: #999; font-size: 20px; width: 20px; height: 20px; }
    .search-input {
      flex: 1; border: none; outline: none; font-size: 14px;
      padding: 12px 0; background: transparent;
    }
    .clear-btn {
      border: none; background: none; cursor: pointer;
      display: flex; align-items: center; color: #999; padding: 4px;
    }
    .clear-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .empty-state {
      text-align: center; padding: 64px 24px; color: #999;
    }
    .empty-icon {
      font-size: 56px !important; width: 56px !important; height: 56px !important;
      margin-bottom: 16px; color: #ccc;
    }
    .empty-title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px; }
    .empty-sub { font-size: 14px; margin: 0 0 24px; }

    .user-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;
    }
    .user-card {
      background: white; border-radius: 12px; padding: 20px;
      cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      display: flex; flex-direction: column; gap: 14px;
    }
    .user-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.10);
    }
    .card-top { display: flex; align-items: center; gap: 14px; }
    .user-avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: #f0f0f0; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }
    .user-avatar mat-icon { font-size: 24px; width: 24px; height: 24px; color: #999; }
    .card-body {
      min-width: 0; display: flex; flex-direction: column; gap: 2px;
    }
    .user-name { font-size: 16px; font-weight: 600; color: #1a1a1a; }
    .user-username { font-size: 13px; color: #999; }
    .role-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 600; text-transform: capitalize;
      padding: 2px 10px; border-radius: 10px; width: fit-content; margin-top: 2px;
    }
    .role-dispatcher { background: #f5f5f5; color: #1a1a1a; }
    .role-driver { background: #f5f5f5; color: #1a1a1a; }

    .card-actions {
      border-top: 1px solid #f0f0f0; padding-top: 12px;
      display: flex; gap: 8px;
    }
    .card-actions button { flex: 1; font-size: 13px; }
    .card-actions .btn-delete { color: #1a1a1a !important; }

    @media (max-width: 768px) {
      .header-row { flex-direction: column; gap: 12px; align-items: center; text-align: center; }
      .user-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class UserList {
  private auth = inject(AuthService);
  private userManagementService = inject(UserManagementService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private confirm = injectConfirmDialog();

  readonly users = signal<User[]>([]);
  readonly searchQuery = signal('');
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    dispatcher: 'Dispatcher',
    driver: 'Conductor',
  };

  readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.users();
    return this.users().filter(
      (u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q),
    );
  });

  constructor() {
    this.loadUsers();
    effect(() => {
      const q = this.searchQuery();
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => this.loadUsers(q), 300);
    });
  }

  loadUsers(search?: string) {
    const hospitalId = this.auth.hospitalId();
    if (hospitalId) {
      this.userManagementService.getAll(hospitalId).subscribe((data) => this.users.set(data));
    }
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(UserFormDialog, {
      width: '480px',
      data: { user: null },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const hospitalId = this.auth.hospitalId();
      if (!hospitalId) return;
      this.userManagementService.create({ ...result, hospitalId }).subscribe({
        next: () => {
          this.snackBar.open('Usuario creado', 'Cerrar', { duration: 3000 });
          this.loadUsers(this.searchQuery());
        },
      });
    });
  }

  openEditDialog(user: User) {
    const dialogRef = this.dialog.open(UserFormDialog, {
      width: '480px',
      data: { user },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.userManagementService.update(user.id, result).subscribe({
        next: () => {
          this.snackBar.open('Usuario actualizado', 'Cerrar', { duration: 3000 });
          this.loadUsers(this.searchQuery());
        },
      });
    });
  }

  confirmDelete(user: User) {
    this.confirm({
      title: 'Eliminar usuario',
      message: `¿Estás seguro de eliminar a "${user.name}"?`,
      confirmText: 'Eliminar',
      confirmColor: 'warn',
    }).then((ok) => {
      if (ok) {
        this.userManagementService.delete(user.id).subscribe(() => {
          this.snackBar.open('Usuario eliminado', 'Cerrar', { duration: 3000 });
          this.loadUsers(this.searchQuery());
        });
      }
    });
  }
}

// === Dialog ===
import { Component as DC, inject as ij } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@DC({
  selector: 'app-user-form-dialog',
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, FormsModule, MatIconModule, MatDialogModule],
  template: `
    <div class="dialog-header">
      <div class="header-icon">
        <mat-icon>person_add</mat-icon>
      </div>
      <div>
        <h2 mat-dialog-title>{{ data.user ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
        <p class="header-sub">{{ data.user ? 'Modifica los datos del usuario' : 'Crea un nuevo usuario' }}</p>
      </div>
      <button class="dialog-close-btn" mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <mat-form-field appearance="outline" class="full-width">
        <mat-icon matIconPrefix>badge</mat-icon>
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="form.name" placeholder="Nombre completo" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-icon matIconPrefix>person</mat-icon>
        <mat-label>Usuario</mat-label>
        <input matInput [(ngModel)]="form.username" placeholder="nombre_usuario" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-icon matIconPrefix>lock</mat-icon>
        <mat-label>{{ data.user ? 'Nueva contraseña (opcional)' : 'Contraseña' }}</mat-label>
        <input matInput type="password" [(ngModel)]="form.password" placeholder="Mínimo 6 caracteres" />
        @if (!data.user) {
          <mat-error>Mínimo 6 caracteres</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-icon matIconPrefix>work</mat-icon>
        <mat-label>Rol</mat-label>
        <mat-select [(ngModel)]="form.role">
          <mat-option value="dispatcher">Dispatcher</mat-option>
          <mat-option value="driver">Conductor</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="center">
      <button mat-button class="btn-cancel" mat-dialog-close>Cancelar</button>
      <button mat-flat-button class="btn-save" [disabled]="!form.name || !form.username || (!data.user && (!form.password || form.password.length < 6))" (click)="save()">
        <mat-icon>{{ data.user ? 'save' : 'add' }}</mat-icon>
        {{ data.user ? 'Guardar Cambios' : 'Crear Usuario' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex; align-items: center; gap: 14px;
      padding: 24px 24px 0;
    }
    .header-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: #f0f0f0; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }
    .header-icon mat-icon { font-size: 24px; width: 24px; height: 24px; color: #1a1a1a; }
    h2 { margin: 0; font-weight: 700; font-size: 20px; color: #1a1a1a; }
    .header-sub { margin: 2px 0 0; font-size: 14px; color: #999; }
    .dialog-content {
      padding: 16px 24px 8px !important;
      display: flex; flex-direction: column; gap: 14px;
    }
    .full-width { width: 100%; }

    .dialog-close-btn {
      margin-left: auto; background: none; border: none; cursor: pointer;
      padding: 6px; border-radius: 6px; color: #999;
      transition: background 0.2s; display: flex; align-items: center;
    }
    .dialog-close-btn:hover { background: #f5f5f5; }
    .dialog-close-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .btn-cancel {
      font-weight: 600; border: 1px solid #d0d0d0 !important;
      border-radius: 8px !important; color: #1a1a1a !important;
    }
    .btn-save {
      border-radius: 8px !important; background: #1a1a1a !important; font-weight: 600;
    }
    ::ng-deep .btn-save .mdc-button__label {
      display: inline-flex !important; align-items: center !important; gap: 6px; color: white !important;
    }
    ::ng-deep .btn-save .mdc-button__label mat-icon { color: white !important; }

    mat-dialog-actions {
      justify-content: center !important; gap: 12px;
    }
    mat-dialog-actions button { min-width: 140px; }

    @media (max-width: 600px) {
      .dialog-header { padding: 16px 16px 0; flex-direction: column; text-align: center; }
      .dialog-content { padding: 12px 16px 8px !important; }
      mat-dialog-actions { flex-direction: column; gap: 8px; align-items: stretch; }
      mat-dialog-actions button { width: 100%; min-width: 0; }
    }
  `],
})
export class UserFormDialog {
  readonly dialogRef = ij(MatDialogRef<UserFormDialog>);
  readonly data = ij<{ user: User | null }>(MAT_DIALOG_DATA);

  readonly form = {
    name: this.data.user?.name || '',
    username: this.data.user?.username || '',
    password: '',
    role: this.data.user?.role || ('dispatcher' as string),
  };

  readonly editingRole = !!this.data.user;

  save() {
    if (!this.form.name || !this.form.username) return;
    if (!this.data.user && (!this.form.password || this.form.password.length < 6)) return;
    const result: any = {
      name: this.form.name,
      username: this.form.username,
      role: this.form.role,
    };
    if (this.form.password) result.password = this.form.password;
    this.dialogRef.close(result);
  }
}
