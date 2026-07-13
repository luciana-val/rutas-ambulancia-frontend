import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private auth = inject(AuthService);
  private errorTimeout: ReturnType<typeof setTimeout> | null = null;

  username = signal('');
  password = signal('');
  error = signal('');
  loading = signal(false);
  hidePassword = signal(true);

  onSubmit() {
    if (!this.username() || !this.password()) {
      this.showError('Todos los campos son obligatorios');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login({ username: this.username(), password: this.password() }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.auth.handleLoginResponse(res);
      },
      error: (err) => {
        this.loading.set(false);
        this.showError(err.status === 401 ? 'Credenciales inválidas' : 'Error del servidor');
      },
    });
  }

  private showError(msg: string) {
    this.error.set(msg);
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.errorTimeout = setTimeout(() => this.error.set(''), 5000);
  }
}
