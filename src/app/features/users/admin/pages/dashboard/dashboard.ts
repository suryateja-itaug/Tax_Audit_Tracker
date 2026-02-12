import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, catchError, interval, of } from 'rxjs';
import { AdminService } from '../../admin-services/admin-services';
import { AdminApiService } from '../../data/admin-api.service';
import { DashboardResponse, ModuleType } from '../../data/admin.models';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  activeModule: ModuleType = 'audit';
  loading = false;
  summarySearch = '';

  dashboard: DashboardResponse = {
    module: 'audit',
    stats: { total: 0, onTrack: 0, atRisk: 0, overdue: 0 },
    stages: [],
    upcoming: [],
    summary: [],
  };

  private readonly subscriptions = new Subscription();
  private dashboardRequestVersion = 0;
  private stageBarPercents: Record<string, number> = {};
  private upcomingBarPercents: Record<string, number> = {};
  private animationTimers: ReturnType<typeof setTimeout>[] = [];
  donutBackgroundValue = 'conic-gradient(#dbe3f1 0 100%)';
  donutAnimating = false;

  constructor(
    private adminService: AdminService,
    private adminApi: AdminApiService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.adminService.module$.subscribe((module) => {
        this.activeModule = module;
        this.loadDashboard();
      }),
    );

    this.subscriptions.add(
      this.route.queryParamMap.subscribe((params) => {
        const moduleFromUrl = params.get('module');
        if (moduleFromUrl === 'audit' || moduleFromUrl === 'tax') {
          this.adminService.setModule(moduleFromUrl);
        }
      }),
    );

    this.subscriptions.add(
      this.adminService.refresh$.subscribe(() => {
        this.loadDashboard();
      }),
    );

    // Auto refresh keeps dashboard populated if API was unavailable during first render.
    this.subscriptions.add(
      interval(10000).subscribe(() => {
        this.loadDashboard();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearAnimationTimers();
  }

  get stats() {
    return this.dashboard.stats;
  }

  get totalEngagements(): number {
    return this.dashboard.stats.total;
  }

  get stages() {
    return this.dashboard.stages;
  }

  get upcomingItems() {
    return this.dashboard.upcoming;
  }

  get summaryRows() {
    return this.dashboard.summary;
  }

  get filteredSummaryRows() {
    const query = this.summarySearch.trim().toLowerCase();
    if (!query) {
      return this.summaryRows;
    }

    return this.summaryRows.filter((row) =>
      [row.client, row.engagement, row.stage, row.status, row.manager].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }

  getStagePercent(stageName: string): number {
    return this.stageBarPercents[stageName] ?? 0;
  }

  getUpcomingPercent(itemId: string): number {
    return this.upcomingBarPercents[itemId] ?? 0;
  }

  private buildDonutBackground(): string {
    const { overdue, atRisk, onTrack, total } = this.stats;
    if (total === 0) {
      return 'conic-gradient(#dbe3f1 0 100%)';
    }

    const gap = 1.2;
    const onTrackEnd = (onTrack / total) * 100;
    const atRiskEnd = onTrackEnd + (atRisk / total) * 100;
    const overdueEnd = atRiskEnd + (overdue / total) * 100;

    return `conic-gradient(
      from -90deg,
      #8fc0f8 0 ${onTrackEnd}%,
      #ffffff ${onTrackEnd}% ${onTrackEnd + gap}%,
      #3f7fe1 ${onTrackEnd + gap}% ${atRiskEnd}%,
      #ffffff ${atRiskEnd}% ${atRiskEnd + gap}%,
      #2644b7 ${atRiskEnd + gap}% ${overdueEnd}%,
      #ffffff ${overdueEnd}% 100%
    )`;
  }

  onStatusClick(status: 'Overdue' | 'At Risk' | 'On Track'): void {
    const count =
      status === 'Overdue' ? this.stats.overdue : status === 'At Risk' ? this.stats.atRisk : this.stats.onTrack;
    if (count === 0) {
      return;
    }

    this.router.navigate(['/admin/engagements'], {
      queryParams: { module: this.activeModule, status },
    });
  }

  onStageClick(stageName: string): void {
    this.router.navigate(['/admin/engagements'], {
      queryParams: { module: this.activeModule, stage: stageName },
    });
  }

  onUpcomingClick(engagementId: string): void {
    this.router.navigate(['/admin/engagements', engagementId]);
  }

  onSummaryClick(engagementId: string): void {
    this.router.navigate(['/admin/engagements', engagementId]);
  }

  onSummaryClientClick(clientId: string): void {
    this.router.navigate(['/admin/clients', clientId]);
  }

  viewAllUpcoming(): void {
    this.router.navigate(['/admin/engagements'], {
      queryParams: { module: this.activeModule, status: 'Overdue' },
    });
  }

  private loadDashboard(): void {
    const requestVersion = ++this.dashboardRequestVersion;
    const moduleAtRequestTime = this.activeModule;
    this.loading = true;
    this.subscriptions.add(
      this.adminApi
        .getDashboard(moduleAtRequestTime)
        .pipe(
          catchError(() => {
            return of({
              module: moduleAtRequestTime,
              stats: { total: 0, onTrack: 0, atRisk: 0, overdue: 0 },
              stages: [],
              upcoming: [],
              summary: [],
            } as DashboardResponse);
          }),
        )
        .subscribe((data) => {
          const isStale =
            requestVersion !== this.dashboardRequestVersion || moduleAtRequestTime !== this.activeModule;
          if (isStale) {
            return;
          }
          this.dashboard = data;
          this.runBarAnimations();
          this.loading = false;
        }),
    );
  }

  private runBarAnimations(): void {
    this.clearAnimationTimers();

    this.stageBarPercents = {};
    this.dashboard.stages.forEach((stage) => {
      this.stageBarPercents[stage.name] = 0;
    });

    this.upcomingBarPercents = {};
    this.dashboard.upcoming.forEach((item) => {
      this.upcomingBarPercents[item.id] = 0;
    });

    this.donutAnimating = false;
    this.donutBackgroundValue = 'conic-gradient(#dbe3f1 0 100%)';

    this.animationTimers.push(
      setTimeout(() => {
        this.donutBackgroundValue = this.buildDonutBackground();
        this.donutAnimating = true;
        this.animationTimers.push(
          setTimeout(() => {
            this.donutAnimating = false;
          }, 900),
        );

        this.dashboard.stages.forEach((stage, idx) => {
          this.animationTimers.push(
            setTimeout(() => {
              this.stageBarPercents[stage.name] = stage.percent;
            }, idx * 55),
          );
        });

        this.dashboard.upcoming.forEach((item, idx) => {
          this.animationTimers.push(
            setTimeout(() => {
              this.upcomingBarPercents[item.id] = item.progress;
            }, idx * 90),
          );
        });
      }, 40),
    );
  }

  private clearAnimationTimers(): void {
    this.animationTimers.forEach((timer) => clearTimeout(timer));
    this.animationTimers = [];
  }
}
