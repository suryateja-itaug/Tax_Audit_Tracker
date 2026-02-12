import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, catchError, finalize, of, switchMap } from 'rxjs';
import { AdminService } from '../../admin-services/admin-services';
import { AdminApiService } from '../../data/admin-api.service';
import { EngagementModel, EngagementStage, EngagementStep, HistoryItem } from '../../data/admin.models';

type EditorKind = 'stage' | 'step';

type EditorComment = {
  author: string;
  title: string;
  message: string;
  when: string;
};

@Component({
  selector: 'app-engagement-detail',
  standalone: false,
  templateUrl: './engagement-detail.html',
  styleUrl: './engagement-detail.css',
})
export class EngagementDetail implements OnInit, OnDestroy {
  engagement: EngagementModel | null = null;
  history: HistoryItem[] = [];
  searchTerm = '';

  expandedStageIds = new Set<string>();

  editorOpen = false;
  editorKind: EditorKind = 'stage';
  editorSaving = false;
  editorError = '';
  editorStageId = '';
  editorStepId = '';
  editorComments: EditorComment[] = [];

  editorForm = {
    name: '',
    status: 'Not Started',
    enabled: true,
    targetStart: '',
    targetEnd: '',
    actualStart: '',
    actualEnd: '',
    comment: '',
  };

  private editorInitial = {
    enabled: true,
    targetStart: '',
    targetEnd: '',
    actualStart: '',
    actualEnd: '',
    status: 'Not Started',
  };

  private engagementId = '';
  private readonly subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminApi: AdminApiService,
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        if (!id) {
          return;
        }
        this.engagementId = id;
        this.loadEngagement();
        this.loadHistory();
      }),
    );

    this.subscriptions.add(
      this.adminService.refresh$.subscribe(() => {
        if (!this.engagementId) {
          return;
        }
        this.loadEngagement();
        this.loadHistory();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get filteredStages(): EngagementStage[] {
    if (!this.engagement) {
      return [];
    }

    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return this.engagement.stages;
    }

    return this.engagement.stages.filter((stage) => {
      if (stage.name.toLowerCase().includes(query)) {
        return true;
      }
      return stage.steps.some((step) => step.name.toLowerCase().includes(query));
    });
  }

  get editorTitle(): string {
    return this.editorKind === 'stage' ? 'Edit Stage' : 'Edit Step';
  }

  goBackToClient(): void {
    if (!this.engagement?.clientId) {
      this.router.navigate(['/admin/clients']);
      return;
    }
    this.router.navigate(['/admin/clients', this.engagement.clientId]);
  }

  toggleStageExpand(stage: EngagementStage): void {
    if (this.expandedStageIds.has(stage.id)) {
      this.expandedStageIds.delete(stage.id);
      return;
    }
    this.expandedStageIds.add(stage.id);
  }

  isStageExpanded(stageId: string): boolean {
    return this.expandedStageIds.has(stageId);
  }

  openStageEditor(stage: EngagementStage): void {
    this.editorOpen = true;
    this.editorKind = 'stage';
    this.editorError = '';
    this.editorStageId = stage.id;
    this.editorStepId = '';

    this.editorForm = {
      name: stage.name,
      status: stage.status,
      enabled: stage.enabled !== false,
      targetStart: stage.targetStart,
      targetEnd: stage.targetEnd,
      actualStart: '',
      actualEnd: '',
      comment: '',
    };

    this.editorInitial = {
      enabled: stage.enabled !== false,
      targetStart: stage.targetStart,
      targetEnd: stage.targetEnd,
      actualStart: '',
      actualEnd: '',
      status: stage.status,
    };

    this.rebuildEditorComments();
  }

  openStepEditor(stage: EngagementStage, step: EngagementStep): void {
    this.editorOpen = true;
    this.editorKind = 'step';
    this.editorError = '';
    this.editorStageId = stage.id;
    this.editorStepId = step.id;

    this.editorForm = {
      name: step.name,
      status: step.status,
      enabled: step.enabled !== false,
      targetStart: step.targetStart,
      targetEnd: step.targetEnd,
      actualStart: step.actualStart || '',
      actualEnd: step.actualEnd || '',
      comment: step.comment || '',
    };

    this.editorInitial = {
      enabled: step.enabled !== false,
      targetStart: step.targetStart,
      targetEnd: step.targetEnd,
      actualStart: step.actualStart || '',
      actualEnd: step.actualEnd || '',
      status: step.status,
    };

    this.rebuildEditorComments();
  }

  closeEditor(): void {
    if (this.editorSaving) {
      return;
    }
    this.editorOpen = false;
    this.editorError = '';
  }

  saveEditor(): void {
    if (!this.engagement || this.editorSaving) {
      return;
    }

    if (this.editorKind === 'stage') {
      this.saveStageEditor();
      return;
    }

    this.saveStepEditor();
  }

  stageStatusClass(status: string): string {
    if (status === 'Completed') return 'ok';
    if (status === 'In Progress') return 'progress';
    if (status === 'At Risk') return 'risk';
    if (status === 'Overdue') return 'overdue';
    return 'notstarted';
  }

  stepStatusClass(status: string): string {
    if (status === 'Completed') return 'ok';
    if (status === 'In Progress') return 'progress';
    if (status === 'On Hold') return 'risk';
    if (status === 'Overdue') return 'overdue';
    return 'notstarted';
  }

  formatEditorTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    const hh = `${date.getHours()}`.padStart(2, '0');
    const mm = `${date.getMinutes()}`.padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  }

  private saveStageEditor(): void {
    if (!this.engagement) {
      return;
    }

    const stage = this.engagement.stages.find((item) => item.id === this.editorStageId);
    if (!stage) {
      return;
    }

    this.editorSaving = true;
    this.editorError = '';

    this.subscriptions.add(
      this.adminApi
        .updateStageConfig(this.engagementId, stage.id, {
          enabled: this.editorForm.enabled,
          targetStart: this.editorForm.targetStart,
          targetEnd: this.editorForm.targetEnd,
          comment: this.editorForm.comment.trim() || undefined,
        })
        .pipe(
          catchError((error) => of({ error } as const)),
          finalize(() => {
            this.editorSaving = false;
          }),
        )
        .subscribe((result) => {
          if ('error' in result) {
            this.editorError = (result.error?.error?.message as string | undefined) || 'Failed to save stage.';
            return;
          }

          this.engagement = result;
          this.editorOpen = false;
          this.expandedStageIds.add(stage.id);
          this.loadHistory();
          this.adminService.notifyRefresh();
        }),
    );
  }

  private saveStepEditor(): void {
    if (!this.engagement) {
      return;
    }

    const stage = this.engagement.stages.find((item) => item.id === this.editorStageId);
    const step = stage?.steps.find((item) => item.id === this.editorStepId);
    if (!stage || !step) {
      return;
    }

    this.editorSaving = true;
    this.editorError = '';

    const stageNeedsPatch =
      this.editorForm.enabled !== this.editorInitial.enabled ||
      this.editorForm.targetStart !== this.editorInitial.targetStart ||
      this.editorForm.targetEnd !== this.editorInitial.targetEnd;

    const stepPatch$ = stageNeedsPatch
      ? this.adminApi.updateStageConfig(this.engagementId, stage.id, {
          tasks: [
            {
              id: step.id,
              enabled: this.editorForm.enabled,
              targetStart: this.editorForm.targetStart,
              targetEnd: this.editorForm.targetEnd,
            },
          ],
          comment: this.editorForm.comment.trim() || undefined,
        })
      : of(this.engagement);

    this.subscriptions.add(
      stepPatch$
        .pipe(
          switchMap(() =>
            this.adminApi.updateStep(this.engagementId, step.id, {
              status: this.editorForm.status,
              actualStart: this.editorForm.actualStart || undefined,
              actualEnd: this.editorForm.actualEnd || undefined,
              comment: this.editorForm.comment.trim() || undefined,
            }),
          ),
          catchError((error) => of({ error } as const)),
          finalize(() => {
            this.editorSaving = false;
          }),
        )
        .subscribe((result) => {
          if ('error' in result) {
            this.editorError = (result.error?.error?.message as string | undefined) || 'Failed to save step.';
            return;
          }

          this.engagement = result;
          this.editorOpen = false;
          this.expandedStageIds.add(stage.id);
          this.loadHistory();
          this.adminService.notifyRefresh();
        }),
    );
  }

  private loadEngagement(): void {
    this.subscriptions.add(
      this.adminApi
        .getEngagementById(this.engagementId)
        .pipe(catchError(() => of(null)))
        .subscribe((engagement) => {
          this.engagement = engagement;
          if (!engagement) {
            return;
          }

          if (!this.expandedStageIds.size && engagement.stages.length) {
            this.expandedStageIds.add(engagement.stages[0].id);
          }
        }),
    );
  }

  private loadHistory(): void {
    this.subscriptions.add(
      this.adminApi
        .getHistory(this.engagementId)
        .pipe(catchError(() => of([])))
        .subscribe((history) => {
          this.history = history;
          if (this.editorOpen) {
            this.rebuildEditorComments();
          }
        }),
    );
  }

  private rebuildEditorComments(): void {
    const targetLabel =
      this.editorKind === 'stage'
        ? this.engagement?.stages.find((item) => item.id === this.editorStageId)?.name || ''
        : this.engagement?.stages
            .flatMap((stage) => stage.steps)
            .find((step) => step.id === this.editorStepId)?.name || '';

    const relevant = this.history
      .filter((item) => {
        if (!targetLabel) {
          return false;
        }
        return item.field.toLowerCase().includes(targetLabel.toLowerCase());
      })
      .slice(0, 8)
      .map((item) => {
        const message = item.comment?.trim() ? item.comment : `${item.previousValue} -> ${item.newValue}`;
        return {
          author: item.user,
          title: item.field,
          message,
          when: this.formatEditorTime(item.changedAt),
        };
      });

    if (!relevant.length) {
      this.editorComments = [
        {
          author: 'System',
          title: 'No comments yet',
          message: 'Add a comment and click Save to record updates for this item.',
          when: '',
        },
      ];
      return;
    }

    this.editorComments = relevant;
  }
}
