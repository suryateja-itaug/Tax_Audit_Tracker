import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, catchError, of } from 'rxjs';
import { AdminService } from '../../admin-services/admin-services';
import { AdminApiService } from '../../data/admin-api.service';
import { EngagementModel, ModuleType } from '../../data/admin.models';

interface StageStatistics {
  name: string;
  total: number;
  sharePercent: number;
  avgProgress: number;
  avgDaysToTarget: number;
  statusSegments: Array<{ label: string; count: number; percent: number; cssClass: string }>;
  stepSegments: Array<{ label: string; count: number; percent: number; cssClass: string }>;
}

@Component({
  selector: 'app-stage-statistics',
  standalone: false,
  templateUrl: './stage-statistics.html',
  styleUrl: './stage-statistics.scss',
})
export class StageStatisticsPage implements OnInit, OnDestroy {
  activeModule: ModuleType = 'audit';
  stageName = '';
  loading = false;
  insight: StageStatistics | null = null;

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly adminService: AdminService,
    private readonly adminApi: AdminApiService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.adminService.module$.subscribe((module) => {
        this.activeModule = module;
      }),
    );

    this.subscriptions.add(
      this.route.queryParamMap.subscribe((params) => {
        const moduleFromUrl = params.get('module');
        const stageParam = params.get('stage') || '';

        if (moduleFromUrl === 'audit' || moduleFromUrl === 'tax') {
          this.activeModule = moduleFromUrl;
          this.adminService.setModule(moduleFromUrl);
        }

        this.stageName = stageParam;
        this.loadStageStatistics();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  backToDashboard(): void {
    this.router.navigate(['/admin/dashboard'], {
      queryParams: { module: this.activeModule },
    });
  }

  openStageEngagements(): void {
    if (!this.stageName) {
      return;
    }

    this.router.navigate(['/admin/engagements'], {
      queryParams: { module: this.activeModule, stage: this.stageName },
    });
  }

  private loadStageStatistics(): void {
    if (!this.stageName) {
      this.insight = null;
      return;
    }

    this.loading = true;
    this.subscriptions.add(
      this.adminApi
        .getEngagements({ module: this.activeModule })
        .pipe(
          catchError(() =>
            of({
              total: 0,
              statusCounts: { All: 0, Overdue: 0, 'At Risk': 0, 'On Track': 0 },
              items: [] as EngagementModel[],
            }),
          ),
        )
        .subscribe((response) => {
          this.insight = this.buildInsight(response.items, response.total);
          this.loading = false;
        }),
    );
  }

  private buildInsight(items: EngagementModel[], moduleTotal: number): StageStatistics | null {
    const stageItems = items.filter((engagement) => engagement.currentStage === this.stageName);
    if (stageItems.length === 0) {
      return {
        name: this.stageName,
        total: 0,
        sharePercent: 0,
        avgProgress: 0,
        avgDaysToTarget: 0,
        statusSegments: [
          { label: 'On Track', count: 0, percent: 0, cssClass: 'on-track' },
          { label: 'At Risk', count: 0, percent: 0, cssClass: 'at-risk' },
          { label: 'Overdue', count: 0, percent: 0, cssClass: 'overdue' },
        ],
        stepSegments: [
          { label: 'Completed', count: 0, percent: 0, cssClass: 'step-completed' },
          { label: 'In Progress', count: 0, percent: 0, cssClass: 'step-progress' },
          { label: 'Not Started', count: 0, percent: 0, cssClass: 'step-not-started' },
          { label: 'Blocked', count: 0, percent: 0, cssClass: 'step-blocked' },
        ],
      };
    }

    const onTrack = stageItems.filter((engagement) => engagement.status === 'On Track').length;
    const atRisk = stageItems.filter((engagement) => engagement.status === 'At Risk').length;
    const overdue = stageItems.filter((engagement) => engagement.status === 'Overdue').length;

    const avgProgress = Math.round(
      stageItems.reduce((sum, engagement) => sum + this.engagementProgress(engagement), 0) / stageItems.length,
    );

    const now = new Date();
    const avgDaysToTarget = Math.round(
      stageItems.reduce((sum, engagement) => sum + this.daysToTarget(engagement.targetDate, now), 0) / stageItems.length,
    );

    const stepCounts = {
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      blocked: 0,
    };

    stageItems.forEach((engagement) => {
      const stage = engagement.stages.find((entry) => entry.name === this.stageName);
      stage?.steps.forEach((step) => {
        const normalized = step.status.toLowerCase();
        if (normalized.includes('completed')) {
          stepCounts.completed += 1;
        } else if (normalized.includes('progress')) {
          stepCounts.inProgress += 1;
        } else if (normalized.includes('hold') || normalized.includes('risk') || normalized.includes('overdue')) {
          stepCounts.blocked += 1;
        } else {
          stepCounts.notStarted += 1;
        }
      });
    });

    const totalSteps = stepCounts.completed + stepCounts.inProgress + stepCounts.notStarted + stepCounts.blocked;

    return {
      name: this.stageName,
      total: stageItems.length,
      sharePercent: moduleTotal === 0 ? 0 : Math.round((stageItems.length / moduleTotal) * 100),
      avgProgress,
      avgDaysToTarget,
      statusSegments: [
        {
          label: 'On Track',
          count: onTrack,
          percent: Math.round((onTrack / stageItems.length) * 100),
          cssClass: 'on-track',
        },
        {
          label: 'At Risk',
          count: atRisk,
          percent: Math.round((atRisk / stageItems.length) * 100),
          cssClass: 'at-risk',
        },
        {
          label: 'Overdue',
          count: overdue,
          percent: Math.round((overdue / stageItems.length) * 100),
          cssClass: 'overdue',
        },
      ],
      stepSegments: [
        {
          label: 'Completed',
          count: stepCounts.completed,
          percent: totalSteps === 0 ? 0 : Math.round((stepCounts.completed / totalSteps) * 100),
          cssClass: 'step-completed',
        },
        {
          label: 'In Progress',
          count: stepCounts.inProgress,
          percent: totalSteps === 0 ? 0 : Math.round((stepCounts.inProgress / totalSteps) * 100),
          cssClass: 'step-progress',
        },
        {
          label: 'Not Started',
          count: stepCounts.notStarted,
          percent: totalSteps === 0 ? 0 : Math.round((stepCounts.notStarted / totalSteps) * 100),
          cssClass: 'step-not-started',
        },
        {
          label: 'Blocked',
          count: stepCounts.blocked,
          percent: totalSteps === 0 ? 0 : Math.round((stepCounts.blocked / totalSteps) * 100),
          cssClass: 'step-blocked',
        },
      ],
    };
  }

  private engagementProgress(engagement: EngagementModel): number {
    if (!engagement.stages.length) {
      return 0;
    }

    const idx = engagement.stages.findIndex((stage) => stage.name === engagement.currentStage);
    if (idx < 0) {
      return 0;
    }

    return Math.round(((idx + 1) / engagement.stages.length) * 100);
  }

  private daysToTarget(targetDate: string, now: Date): number {
    const target = new Date(targetDate);
    if (Number.isNaN(target.getTime())) {
      return 0;
    }

    return Math.ceil((target.getTime() - now.getTime()) / 86400000);
  }
}
