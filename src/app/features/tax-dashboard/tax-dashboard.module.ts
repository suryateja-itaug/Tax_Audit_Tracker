import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaxDashboardComponent } from './tax-dashboard.component';
import { HeaderComponent } from '../../layout/header/header.component';

@NgModule({
  declarations: [TaxDashboardComponent],
  imports: [CommonModule, RouterModule, HeaderComponent],
  exports: [TaxDashboardComponent],
})
export class TaxDashboardModule {}
