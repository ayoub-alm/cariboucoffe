import { Component } from '@angular/core';
import { ErrorPageComponent } from '../error-page/error-page.component';

@Component({
  selector: 'app-service-unavailable',
  standalone: true,
  imports: [ErrorPageComponent],
  template: `<app-error-page code="503"></app-error-page>`
})
export class ServiceUnavailableComponent {}
