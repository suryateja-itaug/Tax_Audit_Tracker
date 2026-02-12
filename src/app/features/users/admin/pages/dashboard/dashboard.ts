import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, catchError, forkJoin, interval, of } from 'rxjs';
import { AdminService } from '../../admin-services/admin-services';
import { AdminApiService } from '../../data/admin-api.service';
import { DashboardResponse, EngagementModel, ModuleType } from '../../data/admin.models';

interface StageInsight {
  name: string;
  total: number;
  sharePercent: number;
  avgProgress: number;
  avgDaysToTarget: number;
  status: {
    onTrack: number;
    atRisk: number;
    overdue: number;
  };
  statusSegments: Array<{ label: string; count: number; percent: number; cssClass: string }>;
  stepSegments: Array<{ label: string; count: number; percent: number; cssClass: string }>;
  topManagers: Array<{ name: string; count: number }>;
}

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
  private stageInsightsMap = new Map<string, StageInsight>();
  private allEngagements: EngagementModel[] = [];
  donutBackgroundValue = 'conic-gradient(#dbe3f1 0 100%)';
  donutAnimating = false;
  hoveredStageName = '';

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

  get hoveredStageInsight(): StageInsight | null {
    if (!this.hoveredStageName) {
      return null;
    }
    return this.stageInsightsMap.get(this.hoveredStageName) ?? null;
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
    this.router.navigate(['/admin/stage-statistics'], {
      queryParams: { module: this.activeModule, stage: stageName },
    });
  }

  onStageHover(stageName: string): void {
    this.hoveredStageName = stageName;
  }

  onStageHoverEnd(): void {
    this.hoveredStageName = '';
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
      forkJoin({
        dashboard: this.adminApi.getDashboard(moduleAtRequestTime).pipe(
          catchError(() =>
            of({
              module: moduleAtRequestTime,
              stats: { total: 0, onTrack: 0, atRisk: 0, overdue: 0 },
              stages: [],
              upcoming: [],
              summary: [],
            } as DashboardResponse),
          ),
        ),
        engagementsResponse: this.adminApi
          .getEngagements({
            module: moduleAtRequestTime,
          })
          .pipe(
            catchError(() =>
              of({
                total: 0,
                statusCounts: { All: 0, Overdue: 0, 'At Risk': 0, 'On Track': 0 },
                items: [] as EngagementModel[],
              }),
            ),
          ),
      }).subscribe(({ dashboard, engagementsResponse }) => {
          const isStale =
            requestVersion !== this.dashboardRequestVersion || moduleAtRequestTime !== this.activeModule;
          if (isStale) {
            return;
          }
          this.dashboard = dashboard;
          this.allEngagements = engagementsResponse.items;
          this.buildStageInsights();
          this.runBarAnimations();
          this.loading = false;
        }),
    );
  }

  private buildStageInsights(): void {
    const now = new Date();
    this.stageInsightsMap = new Map<string, StageInsight>();

    this.dashboard.stages.forEach((stage) => {
      const items = this.allEngagements.filter((engagement) => engagement.currentStage === stage.name);
      const total = items.length;
      const status = {
        onTrack: items.filter((engagement) => engagement.status === 'On Track').length,
        atRisk: items.filter((engagement) => engagement.status === 'At Risk').length,
        overdue: items.filter((engagement) => engagement.status === 'Overdue').length,
      };

      const avgProgress =
        total === 0
          ? 0
          : Math.round(
              items.reduce((sum, engagement) => sum + this.getEngagementProgress(engagement), 0) / total,
            );

      const avgDaysToTarget =
        total === 0
          ? 0
          : Math.round(
              items.reduce((sum, engagement) => sum + this.daysToTarget(engagement.targetDate, now), 0) / total,
            );

      const stepStatusCounts = {
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        blocked: 0,
      };

      items.forEach((engagement) => {
        const stageDetail = engagement.stages?.find((entry) => entry.name === stage.name);
        stageDetail?.steps?.forEach((step) => {
          const stepStatus = step.status.toLowerCase();
          if (stepStatus.includes('completed')) {
            stepStatusCounts.completed += 1;
          } else if (stepStatus.includes('progress')) {
            stepStatusCounts.inProgress += 1;
          } else if (stepStatus.includes('hold') || stepStatus.includes('risk') || stepStatus.includes('overdue')) {
            stepStatusCounts.blocked += 1;
          } else {
            stepStatusCounts.notStarted += 1;
          }
        });
      });

      const totalSteps =
        stepStatusCounts.completed +
        stepStatusCounts.inProgress +
        stepStatusCounts.notStarted +
        stepStatusCounts.blocked;

      const managerCounts = new Map<string, number>();
      items.forEach((engagement) => {
        const key = engagement.managerName || 'Unassigned';
        managerCounts.set(key, (managerCounts.get(key) || 0) + 1);
      });

      const topManagers = Array.from(managerCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const insight: StageInsight = {
        name: stage.name,
        total,
        sharePercent: this.totalEngagements === 0 ? 0 : Math.round((total / this.totalEngagements) * 100),
        avgProgress,
        avgDaysToTarget,
        status,
        statusSegments: [
          {
            label: 'On Track',
            count: status.onTrack,
            percent: total === 0 ? 0 : Math.round((status.onTrack / total) * 100),
            cssClass: 'on-track',
          },
          {
            label: 'At Risk',
            count: status.atRisk,
            percent: total === 0 ? 0 : Math.round((status.atRisk / total) * 100),
            cssClass: 'at-risk',
          },
          {
            label: 'Overdue',
            count: status.overdue,
            percent: total === 0 ? 0 : Math.round((status.overdue / total) * 100),
            cssClass: 'overdue',
          },
        ],
        stepSegments: [
          {
            label: 'Completed',
            count: stepStatusCounts.completed,
            percent: totalSteps === 0 ? 0 : Math.round((stepStatusCounts.completed / totalSteps) * 100),
            cssClass: 'step-completed',
          },
          {
            label: 'In Progress',
            count: stepStatusCounts.inProgress,
            percent: totalSteps === 0 ? 0 : Math.round((stepStatusCounts.inProgress / totalSteps) * 100),
            cssClass: 'step-progress',
          },
          {
            label: 'Not Started',
            count: stepStatusCounts.notStarted,
            percent: totalSteps === 0 ? 0 : Math.round((stepStatusCounts.notStarted / totalSteps) * 100),
            cssClass: 'step-not-started',
          },
          {
            label: 'Blocked',
            count: stepStatusCounts.blocked,
            percent: totalSteps === 0 ? 0 : Math.round((stepStatusCounts.blocked / totalSteps) * 100),
            cssClass: 'step-blocked',
          },
        ],
        topManagers,
      };

      this.stageInsightsMap.set(stage.name, insight);
    });
  }

  private getEngagementProgress(engagement: EngagementModel): number {
    const totalStages = engagement.stages?.length || 0;
    if (!totalStages) {
      return 0;
    }
    const stageIndex = engagement.stages.findIndex((stage) => stage.name === engagement.currentStage);
    if (stageIndex < 0) {
      return 0;
    }
    return Math.round(((stageIndex + 1) / totalStages) * 100);
  }

  private daysToTarget(targetDate: string, now: Date): number {
    const target = new Date(targetDate);
    if (Number.isNaN(target.getTime())) {
      return 0;
    }
    const dayMs = 1000 * 60 * 60 * 24;
    return Math.ceil((target.getTime() - now.getTime()) / dayMs);
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
