import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) return throwError(() => error);

      let msg = 'Error del servidor';

      if (error.error?.message) {
        const m = error.error.message;
        if (m === 'Forbidden resource') {
          msg = 'No tienes permisos para esta acción';
        } else {
          msg = Array.isArray(m) ? m.join('<br>') : m;
        }
      } else if (error.status === 0) {
        msg = 'No se puede conectar con el servidor';
      } else if (error.status === 404) {
        msg = 'Recurso no encontrado';
      } else if (error.status === 403) {
        msg = 'No tienes permisos para esta acción';
      } else if (error.status >= 500) {
        msg = 'Error interno del servidor';
      }

      if (!req.url.includes('/public-alert') && !req.url.includes('/cancel')) {
        snackBar.open(msg, 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
      }

      return throwError(() => error);
    }),
  );
};
