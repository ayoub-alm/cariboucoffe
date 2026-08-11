import { Component } from '@angular/core';
import { ErrorPageComponent } from '../error-page/error-page.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [ErrorPageComponent],
  template: `<app-error-page code="404"></app-error-page>`
})
export class NotFoundComponent {}
