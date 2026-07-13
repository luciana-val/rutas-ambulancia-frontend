import { Component, inject, signal, computed, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from '../../../core/auth/auth.service';
import { AmbulanceService, Ambulance, getPlatePhotoUrl } from '../../../shared/services/ambulance.service';
import { UserManagementService } from '../../../shared/services/user-management.service';
import { injectConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SearchableSelect } from '../../../shared/components/searchable-select/searchable-select';

@Component({
  selector: 'app-ambulance-list',
  imports: [
    MatButtonModule, MatIconModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, FormsModule, MatTooltipModule, MatMenuModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-row">
        <div>
          <h1 class="page-title">Ambulancias</h1>
          <p class="page-subtitle">Gestión de vehículos del hospital</p>
        </div>
        <button mat-flat-button (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nueva Ambulancia
        </button>
      </div>

      <div class="search-bar">
        <mat-icon class="search-icon">search</mat-icon>
        <input
          class="search-input"
          placeholder="Buscar por patente o modelo..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
        />
        @if (searchQuery()) {
          <button class="clear-btn" (click)="searchQuery.set('')">
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>

      @if (filteredAmbulances().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">local_taxi</mat-icon>
          <p class="empty-title">Sin resultados</p>
          <p class="empty-sub">
            @if (searchQuery()) {
              No hay ambulancias que coincidan con "{{ searchQuery() }}"
            } @else {
              No hay ambulancias registradas
            }
          </p>
          @if (!searchQuery()) {
            <button mat-stroked-button (click)="openCreateDialog()">Agregar primera ambulancia</button>
          }
        </div>
      } @else {
        <div class="ambulance-grid">
          @for (a of filteredAmbulances(); track a.id) {
            <div class="ambulance-card" (click)="openCreateDialog(a)">
              <div class="card-left">
                @if (getPlatePhotoUrl(a.platePhoto); as url) {
                  <img [src]="url" class="card-photo" (click)="$event.stopPropagation(); openLightbox(url)" />
                } @else {
                  <div class="card-photo-placeholder">
                    <mat-icon>directions_car</mat-icon>
                  </div>
                }
              </div>
              <div class="card-body">
                <div class="card-top-row">
                  <span class="card-plate">{{ a.plate }}</span>
                  <span class="card-badge badge-{{ a.status }}">
                    <span class="badge-dot"></span>
                    {{ STATUS_LABELS[a.status] || a.status }}
                  </span>
                </div>
                <span class="card-model">{{ a.model || '—' }}</span>
                <div class="card-meta">
                  <span class="meta-item">
                    <mat-icon>person</mat-icon>
                    {{ a.driver?.name || 'Sin conductor' }}
                  </span>
                  <span class="meta-item">
                    <mat-icon>location_on</mat-icon>
                    {{ a.latitude && a.longitude ? a.latitude.toFixed(4) + ', ' + a.longitude.toFixed(4) : 'Sin ubicación' }}
                  </span>
                </div>
                <div class="card-actions">
                  <button class="status-btn" [matMenuTriggerFor]="statusMenu" (click)="$event.stopPropagation()">
                    <span class="status-indicator" [style.background]="statusColor(a.status)"></span>
                    {{ STATUS_LABELS[a.status] || a.status }}
                    <mat-icon>arrow_drop_down</mat-icon>
                  </button>
                  <mat-menu #statusMenu="matMenu" class="status-menu">
                    <button mat-menu-item (click)="$event.stopPropagation(); changeStatus(a, 'active')">
                      <span class="status-indicator" style="background:#2dc937"></span> Disponible
                    </button>
                    <button mat-menu-item (click)="$event.stopPropagation(); changeStatus(a, 'busy')">
                      <span class="status-indicator" style="background:#e7b416"></span> Ocupado
                    </button>
                    <button mat-menu-item (click)="$event.stopPropagation(); changeStatus(a, 'inactive')">
                      <span class="status-indicator" style="background:#888"></span> Inactivo
                    </button>
                  </mat-menu>
                  <button mat-icon-button (click)="$event.stopPropagation(); openCreateDialog(a)" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button class="btn-delete" (click)="$event.stopPropagation(); confirmDelete(a)" matTooltip="Eliminar">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (lightboxUrl()) {
      <div class="lightbox-overlay" (click)="closeLightbox()">
        <img [src]="lightboxUrl()" class="lightbox-img" />
        <button class="lightbox-close" (click)="closeLightbox()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    }
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

    .ambulance-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px;
    }
    .ambulance-card {
      background: white; border-radius: 14px; padding: 16px;
      display: flex; gap: 16px; align-items: flex-start;
      cursor: pointer; transition: box-shadow 0.2s, transform 0.2s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      border: 1px solid #f0f0f0;
    }
    .ambulance-card:hover {
      box-shadow: 0 6px 20px rgba(0,0,0,0.08);
      transform: translateY(-2px);
      border-color: #e0e0e0;
    }
    .card-left { flex-shrink: 0; }
    .card-photo {
      width: 80px; height: 60px; object-fit: cover; border-radius: 10px;
      border: 1px solid #e8e8e8; cursor: pointer; display: block;
      transition: opacity 0.2s;
    }
    .card-photo:hover { opacity: 0.75; }
    .card-photo-placeholder {
      width: 80px; height: 60px; border-radius: 10px;
      background: #f7f7f7; display: flex; align-items: center;
      justify-content: center; border: 1px solid #eee;
    }
    .card-photo-placeholder mat-icon { font-size: 28px; width: 28px; height: 28px; color: #ccc; }
    .card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
    .card-top-row {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .card-plate {
      font-size: 17px; font-weight: 700; font-family: 'Courier New', monospace;
      letter-spacing: 0.5px; color: #1a1a1a;
    }
    .card-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 600; white-space: nowrap;
      padding: 3px 10px; border-radius: 10px;
    }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; }
    .badge-active { background: #e8f5e9; color: #2e7d32; }
    .badge-active .badge-dot { background: #2dc937; }
    .badge-busy { background: #fff8e1; color: #e65100; }
    .badge-busy .badge-dot { background: #e7b416; }
    .badge-inactive { background: #f5f5f5; color: #888; }
    .badge-inactive .badge-dot { background: #888; }
    .card-model { font-size: 13px; color: #999; }
    .card-meta {
      display: flex; flex-wrap: wrap; gap: 4px 16px;
      font-size: 12px; color: #777;
    }
    .meta-item { display: flex; align-items: center; gap: 4px; }
    .meta-item mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; color: #bbb; }
    .card-actions {
      display: flex; align-items: center; gap: 2px; margin-top: 2px;
    }
    .status-btn {
      display: inline-flex; align-items: center; gap: 5px;
      background: #f7f7f7; border: 1px solid #eee; border-radius: 8px;
      padding: 4px 10px; cursor: pointer; font-size: 12px; font-weight: 500; color: #555;
      transition: background 0.15s;
    }
    .status-btn:hover { background: #eee; }
    .status-btn mat-icon { font-size: 18px; width: 18px; height: 18px; color: #999; }
    .status-indicator { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
    .card-actions button { color: #888; }
    .card-actions button:hover { color: #1a1a1a; }
    .btn-delete:hover { color: #c62828 !important; }

    .lightbox-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.85); display: flex;
      align-items: center; justify-content: center; cursor: pointer;
    }
    .lightbox-img {
      max-width: 90vw; max-height: 90vh; border-radius: 8px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    }
    .lightbox-close {
      position: fixed; top: 20px; right: 20px;
      background: rgba(255,255,255,0.15); border: none; border-radius: 50%;
      width: 44px; height: 44px; display: flex; align-items: center;
      justify-content: center; cursor: pointer; color: white;
      transition: background 0.2s;
    }
    .lightbox-close:hover { background: rgba(255,255,255,0.3); }
    .lightbox-close mat-icon { font-size: 24px; width: 24px; height: 24px; }

    @media (max-width: 768px) {
      .header-row { flex-direction: column; gap: 12px; align-items: center; text-align: center; }
      .ambulance-grid { grid-template-columns: 1fr; }
      .ambulance-card { flex-direction: column; align-items: stretch; }
      .card-left { display: flex; justify-content: center; }
      .card-photo, .card-photo-placeholder { width: 100%; height: 100px; }
      .card-top-row { flex-direction: column; align-items: flex-start; gap: 4px; }
      .card-actions { flex-wrap: wrap; }
    }
  `],
})
export class AmbulanceList {
  private auth = inject(AuthService);
  private ambulanceService = inject(AmbulanceService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private confirm = injectConfirmDialog();
  private userManagementService = inject(UserManagementService);

  readonly ambulances = signal<Ambulance[]>([]);
  readonly searchQuery = signal('');
  readonly lightboxUrl = signal<string | null>(null);

  protected getPlatePhotoUrl = getPlatePhotoUrl;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  protected statusColor = (s: string) =>
    s === 'active' ? '#2dc937' : s === 'busy' ? '#e7b416' : '#888';

  readonly STATUS_LABELS: Record<string, string> = {
    active: 'Disponible',
    busy: 'Ocupado',
    inactive: 'Inactivo',
  };

  constructor() {
    this.loadAmbulances();
    effect(() => {
      const q = this.searchQuery();
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => this.loadAmbulances(q), 300);
    });
  }

  readonly filteredAmbulances = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.ambulances();
    return this.ambulances().filter(
      (a) => a.plate.toLowerCase().includes(q) || (a.model && a.model.toLowerCase().includes(q)),
    );
  });

  loadAmbulances(search?: string) {
    const hospitalId = this.auth.hospitalId();
    if (!hospitalId) return;
    this.ambulanceService.getAll(hospitalId).subscribe((data) => this.ambulances.set(data));
  }

  openLightbox(url: string) {
    this.lightboxUrl.set(url);
  }

  closeLightbox() {
    this.lightboxUrl.set(null);
  }

  openCreateDialog(ambulance?: Ambulance) {
    const dialogRef = this.dialog.open(AmbulanceFormDialog, {
      width: '520px',
      data: { ambulance: ambulance || null },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const hospitalId = this.auth.hospitalId();
      if (!hospitalId) return;

      if (result.isEdit) {
        const fd = new FormData();
        if (result.plate) fd.append('plate', result.plate);
        if (result.model) fd.append('model', result.model);
        if (result.photo) fd.append('photo', result.photo);
        if (result.removeDriver) {
          fd.append('removeDriver', 'true');
        }
        if (result.assignDriverId) {
          fd.append('driverId', result.assignDriverId);
        }
        if (result.newDriver) {
          this.userManagementService.create({
            username: result.newDriver.username,
            password: result.newDriver.password,
            name: result.newDriver.name,
            role: 'driver',
            hospitalId,
          }).subscribe({
            next: (driver: any) => {
              const assignFd = new FormData();
              assignFd.append('driverId', driver.id);
              this.ambulanceService.update(result.id, assignFd).subscribe({
                next: () => {
                  this.snackBar.open('Conductor creado y asignado', 'Cerrar', { duration: 3000 });
                  this.loadAmbulances(this.searchQuery());
                },
              });
            },
          });
          return;
        }
        this.ambulanceService.update(result.id, fd).subscribe({
          next: () => {
            this.snackBar.open('Ambulancia actualizada', 'Cerrar', { duration: 3000 });
            this.loadAmbulances(this.searchQuery());
          },
        });
      } else {
        const fd = new FormData();
        fd.append('plate', result.plate);
        fd.append('model', result.model || '');
        fd.append('hospitalId', hospitalId);
        if (result.photo) fd.append('photo', result.photo);
        this.ambulanceService.create(fd).subscribe({
          next: (ambulance) => {
            if (result.driver) {
              this.userManagementService.create({
                username: result.driver.username,
                password: result.driver.password,
                name: result.driver.name,
                role: 'driver',
                hospitalId,
              }).subscribe({
                next: (driver) => {
                  const assignFd = new FormData();
                  assignFd.append('driverId', driver.id);
                  this.ambulanceService.update(ambulance.id, assignFd).subscribe({
                    next: () => {
                      this.snackBar.open('Ambulancia y conductor creados', 'Cerrar', { duration: 3000 });
                      this.loadAmbulances(this.searchQuery());
                    },
                  });
                },
              });
            } else {
              this.snackBar.open('Ambulancia agregada', 'Cerrar', { duration: 3000 });
              this.loadAmbulances(this.searchQuery());
            }
          },
        });
      }
    });
  }

  changeStatus(ambulance: Ambulance, status: string) {
    if (status === ambulance.status) return;
    const fd = new FormData();
    fd.append('status', status);
    this.ambulanceService.update(ambulance.id, fd).subscribe({
      next: () => {
        this.snackBar.open(`Ambulancia ${ambulance.plate} → ${this.STATUS_LABELS[status] || status}`, 'Cerrar', { duration: 3000 });
        this.loadAmbulances(this.searchQuery());
      },
      error: () => this.snackBar.open('Error al cambiar estado', 'Cerrar', { duration: 3000 }),
    });
  }

  confirmDelete(ambulance: Ambulance) {
    this.confirm({
      title: 'Eliminar ambulancia',
      message: `¿Estás seguro de eliminar la ambulancia "${ambulance.plate}"?`,
      confirmText: 'Eliminar',
      confirmColor: 'warn',
    }).then((ok) => {
      if (ok) {
        this.ambulanceService.delete(ambulance.id).subscribe(() => {
          this.snackBar.open('Ambulancia eliminada', 'Cerrar', { duration: 3000 });
          this.loadAmbulances(this.searchQuery());
        });
      }
    });
  }
}

// === Dialog ===
import { Component as DC, inject as ij } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@DC({
  selector: 'app-ambulance-form-dialog',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule, MatIconModule, MatDialogModule, MatCheckboxModule, MatSelectModule, MatTooltipModule, SearchableSelect],
  template: `
    <div class="dialog-header">
      <div class="header-icon">
        <mat-icon>local_taxi</mat-icon>
      </div>
      <div>
        <h2 mat-dialog-title>{{ data.ambulance ? 'Editar Ambulancia' : 'Nueva Ambulancia' }}</h2>
        <p class="header-sub">{{ data.ambulance ? 'Modifica los datos del vehículo' : 'Registra un nuevo vehículo' }}</p>
      </div>
      <button class="dialog-close-btn" mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <div class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-icon matIconPrefix>confirmation_number</mat-icon>
          <mat-label>Patente</mat-label>
          <input matInput [(ngModel)]="plate" placeholder="ABC-1234" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-icon matIconPrefix>directions_car</mat-icon>
          <mat-label>Modelo</mat-label>
          <input matInput [(ngModel)]="model" placeholder="Mercedes Sprinter 2024" />
        </mat-form-field>
      </div>

      <div class="photo-section">
        <p class="section-label"><mat-icon>photo_camera</mat-icon> Foto de la placa</p>
        <div class="photo-upload">
          @if (photoPreview) {
            <img [src]="photoPreview" class="photo-preview" />
          }
          <div class="photo-actions">
            <button type="button" mat-stroked-button (click)="fileInput.click()">
              <mat-icon>photo_camera</mat-icon>
              {{ photoPreview ? 'Cambiar foto' : 'Tomar / Subir foto' }}
            </button>
            @if (photoPreview) {
              <button type="button" mat-icon-button color="warn" (click)="clearPhoto()">
                <mat-icon>delete</mat-icon>
              </button>
            }
          </div>
          <input
            #fileInput
            type="file"
            accept="image/*"
            capture="environment"
            (change)="onPhotoSelected($event)"
            style="display:none"
          />
        </div>
      </div>

      @if (!data.ambulance) {
        <div class="driver-section">
          <p class="section-label"><mat-icon>person_add</mat-icon> Conductor</p>
          <mat-checkbox [(ngModel)]="createDriver">Crear cuenta de conductor</mat-checkbox>
          @if (createDriver) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-icon matIconPrefix>person</mat-icon>
              <mat-label>Usuario conductor</mat-label>
              <input matInput [(ngModel)]="driverUsername" placeholder="conductor1" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-icon matIconPrefix>badge</mat-icon>
              <mat-label>Nombre del conductor</mat-label>
              <input matInput [(ngModel)]="driverName" placeholder="Juan Pérez" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-icon matIconPrefix>lock</mat-icon>
              <mat-label>Contraseña</mat-label>
              <input matInput type="password" [(ngModel)]="driverPassword" placeholder="Mínimo 6 caracteres" />
            </mat-form-field>
          }
        </div>
      }

      @if (data.ambulance) {
        <div class="driver-section">
          <p class="section-label"><mat-icon>person</mat-icon> Conductor asignado</p>
          @if (data.ambulance.driver && !driverRemoved) {
            <div class="driver-assigned">
              <div class="driver-info">
                <span class="driver-avatar">{{ (data.ambulance.driver.name || '?')[0] }}</span>
                <div>
                  <span class="driver-name">{{ data.ambulance.driver.name }}</span>
                  <span class="driver-user">@{{ data.ambulance.driver.id?.slice(0, 8) }}</span>
                </div>
              </div>
              <button type="button" mat-icon-button class="driver-remove" (click)="removeCurrentDriver()" matTooltip="Quitar conductor">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          } @else {
            <div class="driver-empty">
              <mat-icon>person_off</mat-icon>
              <span>Sin conductor asignado</span>
            </div>
            @if (!showDriverForm) {
              <button type="button" mat-stroked-button class="btn-assign" (click)="showDriverForm = true">
                <mat-icon>person_add</mat-icon> Crear o asignar conductor
              </button>
            }
            @if (showDriverForm) {
              <div class="assign-options">
                <app-searchable-select
                  [options]="availableDrivers"
                  [(selected)]="selectedDriverId"
                  placeholder="Seleccionar conductor existente"
                />
                <div class="assign-divider"><span>o</span></div>
                <div class="create-driver-inline">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-icon matIconPrefix>person</mat-icon>
                    <mat-label>Usuario nuevo</mat-label>
                    <input matInput [(ngModel)]="driverUsername" placeholder="conductor1" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-icon matIconPrefix>badge</mat-icon>
                    <mat-label>Nombre</mat-label>
                    <input matInput [(ngModel)]="driverName" placeholder="Juan Pérez" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-icon matIconPrefix>lock</mat-icon>
                    <mat-label>Contraseña</mat-label>
                    <input matInput type="password" [(ngModel)]="driverPassword" placeholder="Mínimo 6 caracteres" />
                  </mat-form-field>
                  <button type="button" mat-flat-button class="btn-create-driver" (click)="createAndAssignDriver()" [disabled]="!driverUsername || !driverPassword || driverPassword.length < 6">
                    <mat-icon>person_add</mat-icon> Crear y asignar
                  </button>
                </div>
              </div>
            }
          }
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="center">
      <button mat-button class="btn-cancel" mat-dialog-close>Cancelar</button>
      <button mat-flat-button class="btn-save" [disabled]="!plate || (!data.ambulance && createDriver && (!driverUsername || !driverPassword || driverPassword.length < 6))" (click)="save()">
        <mat-icon>{{ data.ambulance ? 'save' : 'add' }}</mat-icon>
        {{ data.ambulance ? 'Guardar Cambios' : 'Crear Ambulancia' }}
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
    .dialog-content { padding: 16px 24px 8px !important; display: flex; flex-direction: column; gap: 16px; }
    .full-width { width: 100%; }
    .form-grid { display: flex; flex-direction: column; gap: 14px; }

    .section-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.8px; color: #bbb; margin: 0 0 8px;
    }
    .section-label mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .photo-upload {
      display: flex; align-items: center; gap: 12px;
      padding: 12px; border: 1px dashed #ccc; border-radius: 8px; background: #fafafa;
    }
    .photo-preview {
      width: 80px; height: 60px; object-fit: cover; border-radius: 6px;
      border: 1px solid #e0e0e0; flex-shrink: 0;
    }
    .photo-actions { display: flex; align-items: center; gap: 8px; }

    .driver-section {
      border-top: 1px solid #f0f0f0; padding-top: 16px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .driver-assigned {
      display: flex; align-items: center; justify-content: space-between;
      background: #f8f8f8; border-radius: 10px; padding: 10px 12px;
    }
    .driver-info { display: flex; align-items: center; gap: 10px; }
    .driver-avatar {
      width: 36px; height: 36px; border-radius: 50%; background: #1a1a1a;
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; flex-shrink: 0;
    }
    .driver-name { display: block; font-size: 14px; font-weight: 600; color: #1a1a1a; }
    .driver-user { font-size: 11px; color: #999; }
    .driver-remove { color: #999 !important; }
    .driver-remove:hover { color: #c62828 !important; }
    .driver-empty {
      display: flex; align-items: center; gap: 8px;
      color: #bbb; font-size: 13px; padding: 4px 0;
    }
    .driver-empty mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .btn-assign { width: 100%; border-color: #ddd !important; color: #1a1a1a !important; border-radius: 8px; }
    .assign-options { display: flex; flex-direction: column; gap: 12px; }
    .assign-divider {
      display: flex; align-items: center; gap: 12px; color: #ccc; font-size: 12px;
    }
    .assign-divider::before, .assign-divider::after {
      content: ''; flex: 1; height: 1px; background: #eee;
    }
    .create-driver-inline { display: flex; flex-direction: column; gap: 10px; }
    .btn-create-driver { background: #1a1a1a !important; color: white !important; border-radius: 8px !important; }

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
      .photo-upload { flex-direction: column; align-items: flex-start; }
      mat-dialog-actions { flex-direction: column; gap: 8px; align-items: stretch; }
      mat-dialog-actions button { width: 100%; min-width: 0; }
    }
  `],
})
export class AmbulanceFormDialog {
  readonly dialogRef = ij(MatDialogRef<AmbulanceFormDialog>);
  readonly data = ij<{ ambulance: Ambulance | null }>(MAT_DIALOG_DATA);
  private sanitizer = ij(DomSanitizer);
  private auth = ij(AuthService);
  private userMgmt = ij(UserManagementService);
  private ambulanceService = ij(AmbulanceService);
  private snackBar = ij(MatSnackBar);

  plate = this.data.ambulance?.plate || '';
  model = this.data.ambulance?.model || '';
  photoPreview: SafeUrl | null = null;
  private photoFile: File | null = null;
  private existingPhoto = this.data.ambulance?.platePhoto || null;

  createDriver = false;
  driverUsername = '';
  driverName = '';
  driverPassword = '';

  driverRemoved = false;
  showDriverForm = false;
  selectedDriverId: string | null = null;
  availableDrivers: { id: string; label: string }[] = [];
  pendingNewDriver: { username: string; name: string; password: string } | null = null;

  constructor() {
    if (this.existingPhoto) {
      this.photoPreview = getPlatePhotoUrl(this.existingPhoto) as unknown as SafeUrl;
    }
    if (this.data.ambulance && !this.data.ambulance.driver) {
      this.loadAvailableDrivers();
    }
  }

  private loadAvailableDrivers() {
    const hospitalId = this.auth.hospitalId();
    if (!hospitalId) return;
    const currentAmbulanceId = this.data.ambulance?.id;
    this.ambulanceService.getAll(hospitalId).subscribe(ambulances => {
      const assignedDriverIds = new Set(
        ambulances
          .filter(a => a.id !== currentAmbulanceId && a.driverId)
          .map(a => a.driverId)
      );
      this.userMgmt.getAll(hospitalId).subscribe(users => {
        this.availableDrivers = users
          .filter(u => u.role === 'driver' && !assignedDriverIds.has(u.id))
          .map(u => ({ id: u.id, label: `${u.name || u.username} (@${u.username})` }));
      });
    });
  }

  removeCurrentDriver() {
    this.driverRemoved = true;
    this.showDriverForm = false;
    this.selectedDriverId = null;
  }

  createAndAssignDriver() {
    if (!this.driverUsername || !this.driverPassword || this.driverPassword.length < 6) return;
    this.pendingNewDriver = {
      username: this.driverUsername,
      name: this.driverName || this.driverUsername,
      password: this.driverPassword,
    };
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.photoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview = this.sanitizer.bypassSecurityTrustUrl(e.target?.result as string);
      };
      reader.readAsDataURL(this.photoFile);
    }
  }

  clearPhoto() {
    this.photoFile = null;
    this.photoPreview = null;
  }

  save() {
    if (!this.plate.trim()) return;
    const result: any = {};

    if (this.data.ambulance) {
      result.isEdit = true;
      result.id = this.data.ambulance.id;
      if (this.plate.trim() !== this.data.ambulance.plate) result.plate = this.plate.trim();
      if (this.model.trim() !== this.data.ambulance.model) result.model = this.model.trim();
      if (this.photoFile) result.photo = this.photoFile;

      if (this.driverRemoved) {
        result.removeDriver = true;
      } else if (this.pendingNewDriver) {
        result.newDriver = this.pendingNewDriver;
      } else if (this.selectedDriverId) {
        result.assignDriverId = this.selectedDriverId;
      }

      this.dialogRef.close(result);
      return;
    }

    result.plate = this.plate.trim();
    result.model = this.model.trim();
    if (this.photoFile) result.photo = this.photoFile;
    if (this.createDriver) {
      result.driver = {
        username: this.driverUsername,
        name: this.driverName || this.driverUsername,
        password: this.driverPassword,
      };
    }
    this.dialogRef.close(result);
  }
}
