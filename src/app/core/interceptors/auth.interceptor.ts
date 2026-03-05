import { HttpInterceptorFn } from '@angular/common/http';
import { API_URL } from '../constants';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('access_token');

    const isApiUrl = req.url.startsWith(API_URL);

    if (token && isApiUrl) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req);
};
