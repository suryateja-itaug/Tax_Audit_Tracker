import { Component } from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-tax-dashboard.component',
  standalone:false,
  templateUrl: './tax-dashboard.component.html',
  styleUrl: './tax-dashboard.component.css',
})
export class TaxDashboardComponent {
constructor (private router: Router){}
Ontoogle(){
  this.router.navigate(['audit-dashboard'])
}
}
