import { Component, inject, signal, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule as MatDlg } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { HospitalService, Hospital } from '../../../shared/services/hospital.service';
import { User } from '../../../core/models/user';
import { UserManagementService } from '../../../shared/services/user-management.service';
import { injectConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { HospitalMapDialog } from '../../../shared/components/hospital-map-dialog/hospital-map-dialog';

@Component({
  selector: 'app-hospital-list',
  imports: [
    MatButtonModule, MatIconModule,
    MatDlg, MatFormFieldModule, MatInputModule,
    MatSnackBarModule, MatDividerModule, FormsModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-row">
        <div>
          <h1 class="page-title">Hospitales</h1>
          <p class="page-subtitle">Gestión de centros de salud</p>
        </div>
        <button mat-flat-button (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nuevo Hospital
        </button>
      </div>

      <div class="search-bar">
        <mat-icon class="search-icon">search</mat-icon>
        <input
          class="search-input"
          placeholder="Buscar hospital por nombre..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
        />
        @if (searchQuery()) {
          <button class="clear-btn" (click)="searchQuery.set('')">
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>

      @if (hospitals().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">local_hospital</mat-icon>
          <p class="empty-title">Sin resultados</p>
          <p class="empty-sub">
            @if (searchQuery()) {
              No hay hospitales que coincidan con "{{ searchQuery() }}"
            } @else {
              No hay hospitales registrados
            }
          </p>
          @if (!searchQuery()) {
            <button mat-stroked-button (click)="openCreateDialog()">Crear primer hospital</button>
          }
        </div>
      } @else {
        <div class="hospital-grid">
          @for (h of hospitals(); track h.id) {
            <div class="hospital-card" (click)="openEditDialog(h)">
              <div class="card-top">
                <div class="hosp-icon">
                  <mat-icon>local_hospital</mat-icon>
                </div>
                <div class="hosp-body">
                  <span class="hosp-name">{{ h.name }}</span>
                  <span class="hosp-addr">{{ h.address }}</span>
                </div>
              </div>
              <div class="card-mid">
                @if (h.phone) {
                  <div class="card-row">
                    <mat-icon class="row-icon">phone</mat-icon>
                    <span>{{ h.phone }}</span>
                  </div>
                }
                <div class="card-row">
                  <mat-icon class="row-icon">location_on</mat-icon>
                  <span class="coords">{{ h.latitude?.toFixed(4) }}, {{ h.longitude?.toFixed(4) }}</span>
                </div>
              </div>
               <div class="card-actions">
                 <button mat-button (click)="$event.stopPropagation(); openEditDialog(h)">
                   <mat-icon>edit</mat-icon> Editar
                 </button>
                 <button mat-button class="btn-map" (click)="$event.stopPropagation(); openHospitalMap(h)">
                   <mat-icon>map</mat-icon> Mapa
                 </button>
                 <button mat-button class="btn-delete" (click)="$event.stopPropagation(); confirmDelete(h)">
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
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .header-row button {
      border-radius: 8px;
      background: #1a1a1a !important;
      color: white !important;
    }
    .search-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      padding: 0 14px;
      margin-bottom: 20px;
      transition: border-color 0.15s;
    }
    .search-bar:focus-within {
      border-color: #1a1a1a;
    }
    .search-icon {
      color: #999;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      padding: 12px 0;
      background: transparent;
    }
    .clear-btn {
      border: none;
      background: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      color: #999;
      padding: 4px;
    }
    .clear-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .empty-state {
      text-align: center;
      padding: 64px 24px;
      color: #999;
    }
    .empty-icon {
      font-size: 56px !important;
      width: 56px !important;
      height: 56px !important;
      margin-bottom: 16px;
    }
    .empty-title {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 8px;
    }
    .empty-sub {
      font-size: 14px;
      margin: 0 0 24px;
    }

    .hospital-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }
    .hospital-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .hospital-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.10);
    }
    .card-top {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .hosp-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .hosp-icon mat-icon {
      color: #1a1a1a;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .hosp-body {
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .hosp-name {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .hosp-addr {
      font-size: 13px;
      color: #999;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-mid {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 0 2px;
    }
    .card-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #666;
    }
    .row-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: #999;
    }
    .coords {
      font-family: monospace;
      font-size: 12px;
      color: #bbb;
    }
    .card-actions {
      border-top: 1px solid #f0f0f0;
      padding-top: 12px;
      display: flex;
      gap: 8px;
    }
    .card-actions button {
      flex: 1;
      font-size: 13px;
    }
    .card-actions .btn-map {
      color: #1a1a1a !important;
    }
    .card-actions .btn-delete {
      color: #1a1a1a !important;
    }
    @media (max-width: 768px) {
      .header-row { flex-direction: column; gap: 12px; align-items: center; text-align: center; }
      .hospital-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class HospitalList {
  private hospitalService = inject(HospitalService);
  private userManagementService = inject(UserManagementService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private confirm = injectConfirmDialog();

  readonly hospitals = signal<Hospital[]>([]);
  readonly columns = ['name', 'address', 'phone', 'actions'];
  readonly searchQuery = signal('');

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadHospitals();

    effect(() => {
      const q = this.searchQuery();
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => this.loadHospitals(q), 300);
    });
  }

  private loadHospitals(search?: string) {
    this.hospitalService.getAll(search).subscribe((data) => this.hospitals.set(data));
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(HospitalFormDialog, {
      width: '960px',
      maxWidth: '96vw',
      data: { mode: 'create' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.hospitalService.create({
        name: result.name,
        address: result.address,
        phone: result.phone,
        latitude: result.latitude,
        longitude: result.longitude,
      }).subscribe({
        next: (hospital) => {
          if (result.admin?.username) {
            this.userManagementService.create({
              username: result.admin.username,
              password: result.admin.password,
              name: result.admin.name,
              role: 'admin',
              hospitalId: hospital.id,
            }).subscribe();
          }
          this.snackBar.open('Hospital creado', 'Cerrar', { duration: 3000 });
          this.loadHospitals(this.searchQuery());
        },
      });
    });
  }

  openEditDialog(hospital: Hospital) {
    this.userManagementService.getAll(hospital.id).subscribe((users) => {
      const admin = users.find((u) => u.role === 'admin') || null;
      const dialogRef = this.dialog.open(HospitalFormDialog, {
        width: '960px',
        maxWidth: '96vw',
        data: { mode: 'edit', hospital, admin },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (!result) return;
        const { admin: adminUpdate, ...hospitalData } = result;
        this.hospitalService.update(hospital.id, hospitalData).subscribe(() => {
          if (admin && adminUpdate) {
            const dto: any = {};
            if (adminUpdate.username) dto.username = adminUpdate.username;
            if (adminUpdate.name) dto.name = adminUpdate.name;
            if (adminUpdate.password) dto.password = adminUpdate.password;
            this.userManagementService.update(admin.id, dto).subscribe();
          } else if (!admin && adminUpdate?.username) {
            this.userManagementService.create({
              username: adminUpdate.username,
              password: adminUpdate.password || 'changeme123',
              name: adminUpdate.name || 'Admin',
              role: 'admin',
              hospitalId: hospital.id,
            }).subscribe();
          }
          this.snackBar.open('Hospital actualizado', 'Cerrar', { duration: 3000 });
          this.loadHospitals(this.searchQuery());
        });
      });
    });
  }

  confirmDelete(hospital: Hospital) {
    this.confirm({
      title: 'Eliminar hospital',
      message: `¿Estás seguro de eliminar "${hospital.name}"?\nSe eliminarán también sus usuarios y ambulancias.`,
      confirmText: 'Eliminar',
      confirmColor: 'warn',
    }).then((ok) => {
      if (ok) {
        this.hospitalService.delete(hospital.id).subscribe(() => {
          this.snackBar.open('Hospital eliminado', 'Cerrar', { duration: 3000 });
          this.loadHospitals(this.searchQuery());
        });
      }
    });
  }

  openHospitalMap(h: Hospital) {
    this.dialog.open(HospitalMapDialog, {
      width: '600px',
      maxWidth: '90vw',
      data: h,
    });
  }
}

// === Dialog Component ===
import { Component as DialogComp, inject as inj2, computed } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule as MatDlgInner } from '@angular/material/dialog';
import { MatFormFieldModule as Mff } from '@angular/material/form-field';
import { MatInputModule as Mi } from '@angular/material/input';
import { MatButtonModule as Mb } from '@angular/material/button';
import { FormsModule as Fm } from '@angular/forms';
import { MapView } from '../../../shared/components/map-view/map-view';
import { MapMarker } from '../../../shared/services/map.service';

@DialogComp({
  selector: 'app-hospital-form-dialog',
  imports: [Mff, Mi, Mb, Fm, MatIconModule, MatDlgInner, MapView],
  template: `
    <div class="dialog-header">
      <div class="header-icon">
        <mat-icon>local_hospital</mat-icon>
      </div>
      <div>
        <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Nuevo Hospital' : 'Editar Hospital' }}</h2>
        <p class="header-sub">{{ data.mode === 'create' ? 'Registra un nuevo centro de salud' : 'Modifica los datos del hospital' }}</p>
      </div>
      <button class="dialog-close-btn" mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <div class="dialog-layout">
        <div class="map-column">
          <p class="map-label"><mat-icon>map</mat-icon> Ubicación en el mapa</p>
          <app-map-view
            [markers]="markerSignal()"
            [interactive]="true"
            [showControls]="false"
            [center]="[-64.5, -16.5]"
            [zoom]="5"
            (mapClick)="onMapClick($event)"
            style="height: 340px; border-radius: 10px; overflow: hidden; border: 1px solid #e8e8e8;"
          />
          <p class="map-hint"><mat-icon>touch_app</mat-icon> Haz clic en el mapa para marcar la ubicación</p>
        </div>
        <div class="form-column">
          <p class="form-section-title">Información general</p>

          <mat-form-field appearance="outline" class="full-width">
            <mat-icon matIconPrefix>badge</mat-icon>
            <mat-label>Nombre del hospital</mat-label>
            <input matInput [(ngModel)]="name" placeholder="Hospital Central" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-icon matIconPrefix>location_on</mat-icon>
            <mat-label>Dirección</mat-label>
            <input matInput [(ngModel)]="address" placeholder="Av. Siempre Viva 123" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-icon matIconPrefix>phone</mat-icon>
            <mat-label>Teléfono</mat-label>
            <input matInput [(ngModel)]="phone" placeholder="+54 11 1234-5678" />
          </mat-form-field>

          <div class="admin-section">
            <p class="form-section-title">
              {{ data.mode === 'create' ? 'Administrador del hospital' : 'Administrador asignado' }}
            </p>

            <mat-form-field appearance="outline" class="full-width">
              <mat-icon matIconPrefix>person</mat-icon>
              <mat-label>Usuario admin</mat-label>
              <input matInput [(ngModel)]="adminUsername" placeholder="admin_hospital" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-icon matIconPrefix>badge</mat-icon>
              <mat-label>Nombre del admin</mat-label>
              <input matInput [(ngModel)]="adminName" placeholder="Admin Hospital" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
                <mat-icon matIconPrefix>lock</mat-icon>
                <mat-label>{{ data.mode === 'create' ? 'Contraseña' : 'Nueva contraseña (opcional)' }}</mat-label>
                <input matInput type="password" [(ngModel)]="adminPassword" placeholder="••••••" #pwd="ngModel" [required]="data.mode === 'create'" minlength="6" />
                <mat-error>Mínimo 6 caracteres</mat-error>
              </mat-form-field>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="center">
      <button mat-button class="btn-cancel" mat-dialog-close>Cancelar</button>
      <button mat-flat-button class="btn-save" (click)="save()">
        <mat-icon>{{ data.mode === 'create' ? 'add' : 'save' }}</mat-icon>
        {{ data.mode === 'create' ? 'Crear Hospital' : 'Guardar Cambios' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 24px 24px 0;
    }
    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .header-icon mat-icon { font-size: 24px; width: 24px; height: 24px; color: #1a1a1a; }
    h2 { margin: 0; font-weight: 700; font-size: 20px; color: #1a1a1a; }
    .header-sub { margin: 2px 0 0; font-size: 14px; color: #999; }
    .dialog-content { padding: 0 !important; }
    .dialog-layout { display: flex; gap: 24px; padding: 16px 24px 8px; }
    .map-column { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
    .map-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600; color: #1a1a1a; margin: 0;
    }
    .map-label mat-icon { font-size: 18px; width: 18px; height: 18px; color: #999; }
    .map-hint {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: #999; margin: 0; text-align: center; justify-content: center;
    }
    .map-hint mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .form-column {
      width: 380px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-height: 440px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .form-section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #bbb;
      margin: 0;
    }
    .admin-section {
      border-top: 1px solid #f0f0f0;
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 14px;
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
      font-weight: 600;
      border: 1px solid #d0d0d0 !important;
      border-radius: 8px !important;
      color: #1a1a1a !important;
    }
    .btn-save {
      border-radius: 8px !important;
      background: #1a1a1a !important;
      font-weight: 600;
    }
    ::ng-deep .btn-save .mdc-button__label,
    ::ng-deep .btn-save .mat-mdc-button-persistent-affix {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px;
      color: white !important;
    }
    ::ng-deep .btn-save .mdc-button__label mat-icon,
    ::ng-deep .btn-save .mat-mdc-button-persistent-affix mat-icon {
      color: white !important;
    }

    mat-dialog-actions {
      justify-content: center !important;
      gap: 12px;
    }
    mat-dialog-actions button {
      min-width: 140px;
    }

    @media (max-width: 768px) {
      .dialog-header { padding: 16px 16px 0; }
      .dialog-layout { flex-direction: column; gap: 12px; padding: 12px 12px 8px; }
      .map-column app-map-view { height: 220px !important; }
      .form-column {
        width: 100%;
        max-height: none;
        overflow-y: visible;
        padding-right: 0;
      }
      mat-dialog-actions {
        flex-direction: column;
        gap: 8px;
        padding: 12px 16px 16px !important;
        align-items: stretch;
      }
      mat-dialog-actions button {
        width: 100%;
        min-width: 0;
        justify-content: center;
      }
    }
  `],
})
export class HospitalFormDialog {
  readonly dialogRef = inj2(MatDialogRef<HospitalFormDialog>);
  readonly data = inj2<{ mode: string; hospital?: Hospital; admin?: User | null }>(MAT_DIALOG_DATA);

  name = this.data.hospital?.name || '';
  address = this.data.hospital?.address || '';
  phone = this.data.hospital?.phone || '';
  latitude = signal(this.data.hospital?.latitude ?? 0);
  longitude = signal(this.data.hospital?.longitude ?? 0);
  adminUsername = this.data.admin?.username || '';
  adminName = this.data.admin?.name || '';
  adminPassword = '';

  protected markerSignal = computed<MapMarker[]>(() => {
    const lat = this.latitude();
    const lng = this.longitude();
    if (lat && lng) {
      return [{
        id: 'selected',
        lng,
        lat,
        title: 'Ubicación',
        color: '#e53935',
      }];
    }
    return [];
  });

  onMapClick(e: { lng: number; lat: number }) {
    this.latitude.set(e.lat);
    this.longitude.set(e.lng);
  }

  save() {
    if (this.adminPassword && this.adminPassword.length < 6) return;
    const result: any = {
      name: this.name,
      address: this.address,
      phone: this.phone,
      latitude: this.latitude(),
      longitude: this.longitude(),
    };
    const hasAdminChanges = this.adminUsername || this.adminName || this.adminPassword;
    if (hasAdminChanges) {
      result.admin = {
        username: this.adminUsername,
        name: this.adminName,
      };
      if (this.adminPassword) {
        result.admin.password = this.adminPassword;
      }
    }
    this.dialogRef.close(result);
  }
}
