import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const clone = req.clone({ withCredentials: true });

  return next(clone).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        if (!isRefreshing) {
          isRefreshing = true;
          return auth.refresh().pipe(
            switchMap((res) => {
              isRefreshing = false;
              auth.user.set(res.user);
              return next(clone);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              auth.user.set(null);
              return throwError(() => refreshError);
            }),
          );
        }
      }
      return throwError(() => error);
    }),
  );
};
