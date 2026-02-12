import { Component } from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-audit-dashboard.component',
  standalone: false,
  templateUrl: './audit-dashboard.component.html',
  styleUrl: './audit-dashboard.component.css',
})
export class AuditDashboardComponent {
  constructor(private router: Router){}
Ontoogle(){
  this.router.navigate(['tax-dashboard']);
}
}
