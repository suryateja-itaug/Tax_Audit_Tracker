import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, catchError, forkJoin, of } from 'rxjs';
import { AdminService } from '../../admin-services/admin-services';
import { AdminApiService } from '../../data/admin-api.service';
import { ClientDetailModel, ClientHistoryResponse, EngagementModel, ModuleType, UserModel } from '../../data/admin.models';

@Component({
  selector: 'app-client-detail',
  standalone: false,
  templateUrl: './client-detail.html',
  styleUrl: './client-detail.css',
})
export class ClientDetail implements OnInit, OnDestroy {
  loading = false;
  savingClientEdit = false;
  client: ClientDetailModel | null = null;
  isEditMode = false;
  showAddEngagementModal = false;
  showHistoryDrawer = false;
  historyTab: 'client' | 'engagements' = 'client';
  historyLoading = false;
  historyData: ClientHistoryResponse = { client: [], engagements: [] };
  addEngagementSaving = false;
  addEngagementError = '';
  users: UserModel[] = [];
  readonly industryOptions = [
    'Manufacturing',
    'Healthcare',
    'Retail',
    'Technology',
    'Financial Services',
    'Energy',
    'Education',
    'Other',
  ];

  editClientForm = {
    name: '',
    email: '',
    industry: '',
  };

  editEngagements: Array<{
    id?: string;
    name: string;
    type: ModuleType;
    period: string;
    requiredDate: string;
    targetDate: string;
    partnerId: string;
    managerId: string;
  }> = [];
  engagementForm = {
    type: 'audit' as ModuleType,
    name: '',
    period: '',
    requiredDate: '',
    targetDate: '',
    managerId: '',
  };

  private readonly subscriptions = new Subscription();
  private clientId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminApi: AdminApiService,
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        const clientId = params.get('id');
        if (!clientId) {
          return;
        }
        this.clientId = clientId;
        this.loadClient(clientId);
      }),
    );

    this.subscriptions.add(
      this.adminService.refresh$.subscribe(() => {
        if (this.clientId) {
          this.loadClient(this.clientId);
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  goBack(): void {
    this.router.navigate(['/admin/clients']);
  }

  openEngagement(engagementId: string): void {
    this.router.navigate(['/admin/engagements', engagementId]);
  }

  openHistoryDrawer(): void {
    if (!this.client) {
      return;
    }
    this.showHistoryDrawer = true;
    this.historyTab = 'client';
    this.loadClientHistory(this.client.id);
  }

  closeHistoryDrawer(): void {
    this.showHistoryDrawer = false;
  }

  setHistoryTab(tab: 'client' | 'engagements'): void {
    this.historyTab = tab;
  }

  get activeHistoryItems(): Array<{
    id: string;
    title: string;
    details: string;
    performedBy: string;
    changedAt: string;
  }> {
    return this.historyTab === 'client' ? this.historyData.client : this.historyData.engagements;
  }

  openEditClientMode(): void {
    if (!this.client) {
      return;
    }

    this.isEditMode = true;
    this.addEngagementError = '';
    this.editClientForm = {
      name: this.client.name,
      email: this.client.email || '',
      industry: this.client.industry || this.industryOptions[0],
    };

    const seed = this.client.engagements.length > 0 ? this.client.engagements : [null];
    this.editEngagements = seed.map((engagement) => ({
      id: engagement?.id,
      name: engagement?.name || '',
      type: engagement?.type || 'audit',
      period: engagement?.period || `FY ${new Date().getFullYear()}`,
      requiredDate: engagement?.requiredDate || '',
      targetDate: engagement?.targetDate || '',
      partnerId: engagement?.managerId || '',
      managerId: engagement?.managerId || '',
    }));

    this.ensureUsersLoaded();
  }

  cancelEditClientMode(): void {
    if (this.savingClientEdit) {
      return;
    }
    this.isEditMode = false;
    this.addEngagementError = '';
  }

  addAnotherEngagementRow(): void {
    this.editEngagements.push({
      name: '',
      type: 'audit',
      period: `FY ${new Date().getFullYear()}`,
      requiredDate: '',
      targetDate: '',
      partnerId: '',
      managerId: '',
    });
  }

  saveEditedClient(): void {
    if (!this.client || this.savingClientEdit) {
      return;
    }

    const trimmedName = this.editClientForm.name.trim();
    const trimmedIndustry = this.editClientForm.industry.trim();
    if (!trimmedName || !trimmedIndustry) {
      this.addEngagementError = 'Client name and industry are required.';
      return;
    }

    const newEngagements = this.editEngagements.filter((item) => !item.id && item.name.trim());
    const invalidNewEngagement = newEngagements.find(
      (item) =>
        !item.type ||
        !item.name.trim() ||
        !item.period.trim() ||
        !item.requiredDate ||
        !item.targetDate ||
        !item.managerId,
    );
    if (invalidNewEngagement) {
      this.addEngagementError = 'Fill all required fields for added engagements.';
      return;
    }

    this.savingClientEdit = true;
    this.addEngagementError = '';

    const saveClient$ = this.adminApi.updateClient(this.client.id, {
      name: trimmedName,
      industry: trimmedIndustry,
      email: this.editClientForm.email.trim(),
    });

    const newEngagementRequests = newEngagements.map((item) =>
      this.adminApi.createEngagement({
        clientId: this.client!.id,
        type: item.type,
        name: item.name.trim(),
        period: item.period.trim(),
        requiredDate: item.requiredDate,
        targetDate: item.targetDate,
        managerId: item.managerId,
      }),
    );

    const saveAll$ = forkJoin([saveClient$, ...newEngagementRequests]);

    this.subscriptions.add(
      saveAll$
        .pipe(catchError((error) => of({ error } as const)))
        .subscribe((result: unknown[] | { error: unknown }) => {
          this.savingClientEdit = false;
          if ('error' in result) {
            const backendError = (result as { error: any }).error;
            this.addEngagementError =
              (backendError?.error?.message as string | undefined) || 'Failed to save client changes.';
            return;
          }

          this.isEditMode = false;
          this.loadClient(this.clientId);
          this.adminService.notifyRefresh();
        }),
    );
  }

  openAddEngagementModal(): void {
    if (!this.client) {
      return;
    }

    this.showAddEngagementModal = true;
    this.addEngagementError = '';
    this.engagementForm = {
      type: 'audit',
      name: `FY${new Date().getFullYear()} Audit`,
      period: `FY ${new Date().getFullYear()}`,
      requiredDate: '',
      targetDate: '',
      managerId: '',
    };

    if (this.users.length > 0) {
      this.setDefaultManager();
      return;
    }

    this.subscriptions.add(
      this.adminApi
        .getUsers()
        .pipe(catchError(() => of([] as UserModel[])))
        .subscribe((users) => {
          this.users = users;
          this.setDefaultManager();
        }),
    );
  }

  closeAddEngagementModal(): void {
    if (this.addEngagementSaving) {
      return;
    }
    this.showAddEngagementModal = false;
  }

  onTypeChange(type: ModuleType): void {
    this.engagementForm.type = type;
    this.setDefaultManager();
  }

  saveEngagement(): void {
    if (!this.client || this.addEngagementSaving) {
      return;
    }

    const { type, name, period, requiredDate, targetDate, managerId } = this.engagementForm;
    if (!type || !name.trim() || !period.trim() || !requiredDate || !targetDate || !managerId) {
      this.addEngagementError = 'Please fill all required fields.';
      return;
    }

    this.addEngagementSaving = true;
    this.addEngagementError = '';

    this.subscriptions.add(
      this.adminApi
        .createEngagement({
          clientId: this.client.id,
          type,
          name: name.trim(),
          period: period.trim(),
          requiredDate,
          targetDate,
          managerId,
        })
        .pipe(catchError((error) => of({ error } as const)))
        .subscribe((result) => {
          this.addEngagementSaving = false;
          if ('error' in result) {
            this.addEngagementError =
              (result.error?.error?.message as string | undefined) || 'Failed to create engagement.';
            return;
          }

          this.showAddEngagementModal = false;
          this.loadClient(this.clientId);
          this.adminService.notifyRefresh();
        }),
    );
  }

  managersForType(type: ModuleType): UserModel[] {
    return this.users.filter((user) => user.domain === 'both' || user.domain === type);
  }

  getEngagementProgress(engagement: EngagementModel): number {
    const total = engagement.stages.length;
    if (!total) {
      return engagement.status === 'On Track' ? 60 : 30;
    }

    const done = engagement.stages.filter((stage) => stage.status === 'Completed').length;
    return Math.max(15, Math.min(100, Math.round((done / total) * 100)));
  }

  private loadClient(clientId: string): void {
    this.loading = true;
    this.subscriptions.add(
      this.adminApi
        .getClientById(clientId)
        .pipe(catchError(() => of(null)))
        .subscribe((client) => {
          this.client = client;
          this.loading = false;
        }),
    );
  }

  private setDefaultManager(): void {
    const eligible = this.managersForType(this.engagementForm.type);
    if (!eligible.length) {
      this.engagementForm.managerId = '';
      return;
    }

    if (!eligible.some((user) => user.id === this.engagementForm.managerId)) {
      this.engagementForm.managerId = eligible[0].id;
    }
  }

  private ensureUsersLoaded(): void {
    if (this.users.length > 0) {
      this.ensureEditManagersSelected();
      return;
    }

    this.subscriptions.add(
      this.adminApi
        .getUsers()
        .pipe(catchError(() => of([] as UserModel[])))
        .subscribe((users) => {
          this.users = users;
          this.ensureEditManagersSelected();
        }),
    );
  }

  private ensureEditManagersSelected(): void {
    this.editEngagements = this.editEngagements.map((item) => {
      const eligible = this.managersForType(item.type);
      const managerId =
        eligible.some((user) => user.id === item.managerId) ? item.managerId : (eligible[0]?.id || '');
      const partnerId =
        eligible.some((user) => user.id === item.partnerId) ? item.partnerId : (eligible[0]?.id || managerId);
      return { ...item, managerId, partnerId };
    });
  }

  private loadClientHistory(clientId: string): void {
    this.historyLoading = true;
    this.subscriptions.add(
      this.adminApi
        .getClientHistory(clientId)
        .pipe(catchError(() => of({ client: [], engagements: [] } as ClientHistoryResponse)))
        .subscribe((history) => {
          this.historyData = history;
          this.historyLoading = false;
        }),
    );
  }
}
