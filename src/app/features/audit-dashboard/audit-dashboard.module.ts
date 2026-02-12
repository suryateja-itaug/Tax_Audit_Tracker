import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuditDashboardComponent } from './audit-dashboard.component';
import { HeaderComponent } from '../../layout/header/header.component';

@NgModule({
  declarations: [AuditDashboardComponent],
  imports: [CommonModule, RouterModule,HeaderComponent],
  exports: [AuditDashboardComponent],
})
export class AuditDashboardModule {}
