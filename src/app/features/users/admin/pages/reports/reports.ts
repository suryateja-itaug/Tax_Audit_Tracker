import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, catchError, of } from 'rxjs';
import { AdminService } from '../../admin-services/admin-services';
import { AdminApiService } from '../../data/admin-api.service';
import { ReportModel } from '../../data/admin.models';

@Component({
  selector: 'app-reports',
  standalone: false,
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit, OnDestroy {
  reports: ReportModel[] = [];
  private readonly subscriptions = new Subscription();

  constructor(
    private adminApi: AdminApiService,
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.loadReports();
    this.subscriptions.add(
      this.adminService.refresh$.subscribe(() => {
        this.loadReports();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadReports(): void {
    this.subscriptions.add(
      this.adminApi
        .getReports()
        .pipe(catchError(() => of([])))
        .subscribe((reports) => {
          this.reports = reports;
        }),
    );
  }
}
