import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { NgClass } from "../../../../node_modules/@angular/common/types/_common_module-chunk";


@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent  {
  

  constructor(public router: Router) {}

  
}
