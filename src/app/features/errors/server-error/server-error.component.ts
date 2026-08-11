import { Component } from '@angular/core';
import { ErrorPageComponent } from '../error-page/error-page.component';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [ErrorPageComponent],
  template: `<app-error-page code="500"></app-error-page>`
})
export class ServerErrorComponent {}
