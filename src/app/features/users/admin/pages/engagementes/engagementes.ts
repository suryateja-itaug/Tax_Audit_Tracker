import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, catchError, of } from 'rxjs';
import { AdminService } from '../../admin-services/admin-services';
import { AdminApiService } from '../../data/admin-api.service';
import { EngagementModel, ModuleType } from '../../data/admin.models';

@Component({
  selector: 'app-engagementes',
  standalone: false,
  templateUrl: './engagementes.html',
  styleUrl: './engagementes.css',
})
export class Engagementes implements OnInit, OnDestroy {
  activeModule: ModuleType = 'audit';
  statusFilter = 'All';
  stageFilter = '';
  searchTerm = '';
  currentPage = 1;
  readonly pageSize = 25;
  loading = false;
  selectedIds = new Set<string>();
  private navigating = false;

  statusCounts: Record<string, number> = { All: 0, Overdue: 0, 'At Risk': 0, 'On Track': 0 };
  engagements: EngagementModel[] = [];

  private readonly subscriptions = new Subscription();

  constructor(
    private adminService: AdminService,
    private adminApi: AdminApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.adminService.module$.subscribe((module) => {
        this.activeModule = module;
        this.loadEngagements();
      }),
    );

    this.subscriptions.add(
      this.route.queryParamMap.subscribe((params) => {
        const status = params.get('status');
        const stage = params.get('stage');
        const search = params.get('search');
        const moduleFromUrl = params.get('module') as ModuleType | null;

        if (moduleFromUrl === 'audit' || moduleFromUrl === 'tax') {
          this.activeModule = moduleFromUrl;
          this.adminService.setModule(moduleFromUrl);
        }

        this.statusFilter = status || 'All';
        this.stageFilter = stage || '';
        this.searchTerm = search || '';
        this.loadEngagements();
      }),
    );

    this.subscriptions.add(
      this.adminService.refresh$.subscribe(() => {
        this.loadEngagements();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  setStatus(status: string): void {
    if (this.loading) {
      return;
    }
    this.statusFilter = status;
    this.currentPage = 1;
    this.pushQueryParams();
  }

  applySearch(): void {
    if (this.loading) {
      return;
    }
    this.currentPage = 1;
    this.pushQueryParams();
  }

  clearFilters(): void {
    if (this.loading) {
      return;
    }
    this.statusFilter = 'All';
    this.stageFilter = '';
    this.searchTerm = '';
    this.currentPage = 1;
    this.pushQueryParams();
  }

  onRowClick(id: string): void {
    this.openDetail(id);
  }

  openDetail(id: string): void {
    if (this.loading || this.navigating) {
      return;
    }
    this.navigating = true;
    this.router.navigate(['/admin/engagements', id]).finally(() => {
      this.navigating = false;
    });
  }

  openClientDetail(clientId: string, event: Event): void {
    event.stopPropagation();
    if (this.loading || this.navigating) {
      return;
    }
    this.navigating = true;
    this.router.navigate(['/admin/clients', clientId]).finally(() => {
      this.navigating = false;
    });
  }

  get pagedEngagements(): EngagementModel[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.engagements.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.engagements.length / this.pageSize));
  }

  get isAllOnPageSelected(): boolean {
    return this.pagedEngagements.length > 0 && this.pagedEngagements.every((item) => this.selectedIds.has(item.id));
  }

  previousPage(): void {
    if (this.loading) {
      return;
    }
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  nextPage(): void {
    if (this.loading) {
      return;
    }
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  toggleSelectAll(checked: boolean): void {
    if (this.loading) {
      return;
    }
    if (checked) {
      this.pagedEngagements.forEach((item) => this.selectedIds.add(item.id));
      return;
    }
    this.pagedEngagements.forEach((item) => this.selectedIds.delete(item.id));
  }

  toggleSelection(id: string, checked: boolean): void {
    if (this.loading) {
      return;
    }
    if (checked) {
      this.selectedIds.add(id);
      return;
    }
    this.selectedIds.delete(id);
  }

  getProgressPercent(item: EngagementModel): number {
    const total = item.stages?.length || 0;
    if (!total) {
      if (item.status === 'On Track') return 55;
      if (item.status === 'At Risk') return 35;
      return 20;
    }

    const stageIndex = item.stages.findIndex((stage) => stage.name === item.currentStage);
    if (stageIndex < 0) {
      return Math.max(15, Math.round((1 / total) * 100));
    }
    return Math.max(15, Math.round(((stageIndex + 1) / total) * 100));
  }

  getProgressClass(item: EngagementModel): string {
    if (item.status === 'At Risk') {
      return 'risk';
    }
    if (item.status === 'Overdue') {
      return 'overdue';
    }
    return 'ok';
  }

  getDueText(targetDate: string): string {
    if (!targetDate) {
      return '-';
    }
    const due = new Date(targetDate);
    if (Number.isNaN(due.getTime())) {
      return '-';
    }
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffMs = startOfDue.getTime() - startOfToday.getTime();
    const days = Math.round(diffMs / 86400000);
    if (days >= 0) {
      return `${days} days remaining`;
    }
    return `${Math.abs(days)} days overdue`;
  }

  get showingFrom(): number {
    if (!this.engagements.length) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.engagements.length);
  }

  get showingSummary(): string {
    if (!this.engagements.length) {
      return 'Showing 0 of 0 engagements';
    }
    return `Showing ${this.showingFrom}-${this.showingTo} of ${this.engagements.length} engagements`;
  }

  private pushQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        module: this.activeModule,
        status: this.statusFilter === 'All' ? null : this.statusFilter,
        stage: this.stageFilter || null,
        search: this.searchTerm || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  private loadEngagements(): void {
    this.loading = true;
    this.subscriptions.add(
      this.adminApi
        .getEngagements({
          module: this.activeModule,
          status: this.statusFilter === 'All' ? '' : this.statusFilter,
          stage: this.stageFilter,
          search: this.searchTerm,
        })
        .pipe(
          catchError(() =>
            of({
              total: 0,
              statusCounts: { All: 0, Overdue: 0, 'At Risk': 0, 'On Track': 0 },
              items: [],
            }),
          ),
        )
        .subscribe((response) => {
          this.engagements = response.items;
          this.statusCounts = response.statusCounts;
          this.currentPage = Math.min(this.currentPage, this.totalPages);
          this.loading = false;
        }),
    );
  }
}
