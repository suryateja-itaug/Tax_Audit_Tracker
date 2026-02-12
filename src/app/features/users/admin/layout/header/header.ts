import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription, catchError, forkJoin, of } from 'rxjs';
import { AdminService } from '../../admin-services/admin-services';
import { AdminApiService } from '../../data/admin-api.service';
import { ClientModel, ModuleType, UserModel } from '../../data/admin.models';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  activeModule: ModuleType = 'audit';
  pageTitle = 'Dashboard';
  showHeaderBar = true;
  showModuleToggle = true;
  showAddClientButton = true;
  showAddEngagementButton = true;
  allowedModules: ModuleType[] = ['audit', 'tax'];

  showAddEngagementModal = false;
  addEngagementLoading = false;
  addEngagementSaving = false;
  addEngagementError = '';
  showAddClientModal = false;
  addClientSaving = false;
  addClientError = '';

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

  clients: ClientModel[] = [];
  users: UserModel[] = [];

  engagementForm = {
    clientId: '',
    type: 'audit' as ModuleType,
    name: '',
    period: '',
    requiredDate: '',
    targetDate: '',
    managerId: '',
  };

  clientForm = {
    name: '',
    industry: '',
    primaryContact: '',
    email: '',
    phone: '',
    notes: '',
  };

  clientEngagementDraft = {
    name: '',
    type: 'audit' as ModuleType,
    period: '',
    requiredDate: '',
    targetDate: '',
    partnerId: '',
    managerId: '',
  };

  readonly periodOptions = ['FY 2025', 'FY 2026', 'FY 2027', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];

  @Output() moduleChange = new EventEmitter<ModuleType>();

  private readonly subscriptions = new Subscription();
  private currentClientRouteId = '';

  constructor(
    private adminService: AdminService,
    private adminApi: AdminApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.allowedModules = this.adminService.getAllowedModules();
    this.syncPageTitle(this.router.url);

    this.subscriptions.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => this.syncPageTitle(event.urlAfterRedirects)),
    );

    this.subscriptions.add(
      this.adminService.module$.subscribe((module) => {
        this.activeModule = module;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  switchModule(module: ModuleType): void {
    if (!this.allowedModules.includes(module)) {
      return;
    }
    this.activeModule = module;
    this.moduleChange.emit(module);
    this.adminService.setModule(module);
  }

  openAddClientModal(): void {
    this.showAddClientModal = true;
    this.addClientError = '';
    this.clientForm = {
      name: '',
      industry: this.industryOptions[0],
      primaryContact: '',
      email: '',
      phone: '',
      notes: '',
    };
    this.clientEngagementDraft = {
      name: '',
      type: this.activeModule,
      period: this.periodOptions[0],
      requiredDate: '',
      targetDate: '',
      partnerId: '',
      managerId: '',
    };

    if (!this.users.length) {
      this.subscriptions.add(
        this.adminApi
          .getUsers()
          .pipe(catchError(() => of([] as UserModel[])))
          .subscribe((users) => {
            this.users = users;
            if (!this.clientEngagementDraft.partnerId && users.length > 0) {
              this.clientEngagementDraft.partnerId = users[0].id;
              this.clientEngagementDraft.managerId = users[0].id;
            }
          }),
      );
    }
  }

  closeAddClientModal(): void {
    if (this.addClientSaving) {
      return;
    }
    this.showAddClientModal = false;
  }

  saveClient(): void {
    if (this.addClientSaving) {
      return;
    }

    const payload = {
      name: this.clientForm.name.trim(),
      industry: this.clientForm.industry.trim(),
      primaryContact: this.clientForm.primaryContact.trim(),
      email: this.clientForm.email.trim(),
      phone: this.clientForm.phone.trim(),
      notes: this.clientForm.notes.trim(),
    };

    if (!payload.name || !payload.industry) {
      this.addClientError = 'Client name and industry are required.';
      return;
    }

    this.addClientSaving = true;
    this.addClientError = '';
    this.subscriptions.add(
      this.adminApi
        .createClient(payload)
        .pipe(catchError((error) => of({ error } as const)))
        .subscribe((result) => {
          this.addClientSaving = false;
          if ('error' in result) {
            this.addClientError =
              (result.error?.error?.message as string | undefined) || 'Failed to create client.';
            return;
          }

          this.showAddClientModal = false;
          this.adminService.notifyRefresh();
        }),
    );
  }

  openAddEngagementModal(): void {
    this.showAddEngagementModal = true;
    this.addEngagementError = '';
    this.engagementForm = {
      clientId: '',
      type: this.activeModule,
      name: '',
      period: '',
      requiredDate: '',
      targetDate: '',
      managerId: '',
    };

    this.addEngagementLoading = true;
    this.subscriptions.add(
      forkJoin({
        clients: this.adminApi.getClients().pipe(catchError(() => of([] as ClientModel[]))),
        users: this.adminApi.getUsers().pipe(catchError(() => of([] as UserModel[]))),
      }).subscribe(({ clients, users }) => {
        this.clients = clients;
        this.users = users;
        this.addEngagementLoading = false;

        const routeClient =
          this.currentClientRouteId && this.clients.some((client) => client.id === this.currentClientRouteId)
            ? this.currentClientRouteId
            : '';

        if (routeClient) {
          this.engagementForm.clientId = routeClient;
        } else if (this.clients.length > 0 && !this.engagementForm.clientId) {
          this.engagementForm.clientId = this.clients[0].id;
        }
        const eligibleManagers = this.managersForType(this.engagementForm.type);
        if (eligibleManagers.length > 0 && !this.engagementForm.managerId) {
          this.engagementForm.managerId = eligibleManagers[0].id;
        }
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
    const eligibleManagers = this.managersForType(type);
    if (eligibleManagers.every((u) => u.id !== this.engagementForm.managerId)) {
      this.engagementForm.managerId = eligibleManagers[0]?.id || '';
    }
  }

  saveEngagement(): void {
    if (this.addEngagementSaving) {
      return;
    }

    const { clientId, type, name, period, requiredDate, targetDate, managerId } = this.engagementForm;
    if (!clientId || !type || !name.trim() || !period.trim() || !requiredDate || !targetDate || !managerId) {
      this.addEngagementError = 'Please fill all required fields.';
      return;
    }

    this.addEngagementSaving = true;
    this.addEngagementError = '';

    this.subscriptions.add(
      this.adminApi
        .createEngagement({
          clientId,
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
          this.adminService.notifyRefresh();
        }),
    );
  }

  managersForType(type: ModuleType): UserModel[] {
    return this.users.filter((user) => user.domain === 'both' || user.domain === type);
  }

  private syncPageTitle(url: string): void {
    if (/\/admin\/users\/[^/?#]+/.test(url)) {
      this.pageTitle = '';
      this.showHeaderBar = false;
      this.showModuleToggle = false;
      this.showAddClientButton = false;
      this.showAddEngagementButton = false;
      return;
    }

    const clientDetailMatch = url.match(/\/admin\/clients\/([^/?#]+)/);
    if (clientDetailMatch) {
      this.currentClientRouteId = clientDetailMatch[1];
      this.showHeaderBar = true;
      this.pageTitle = 'Client Detail';
      this.showModuleToggle = false;
      this.showAddClientButton = false;
      this.showAddEngagementButton = true;
      return;
    }

    this.currentClientRouteId = '';

    if (url.includes('/admin/engagements/')) {
      this.showHeaderBar = true;
      this.pageTitle = 'Engagement Detail';
      this.showModuleToggle = false;
      this.showAddClientButton = false;
      this.showAddEngagementButton = false;
      return;
    }

    const titleMap: Record<string, string> = {
      dashboard: 'Dashboard',
      clients: 'Clients',
      engagements: 'Engagements',
      reports: 'Reports',
      users: 'User Management',
      'stage-statistics': 'Stage Statistics',
    };

    const segment = url.split('/').filter(Boolean).at(-1) ?? 'dashboard';
    if (segment === 'users') {
      this.showHeaderBar = false;
      this.pageTitle = '';
      this.showModuleToggle = false;
      this.showAddClientButton = false;
      this.showAddEngagementButton = false;
      return;
    }

    this.showHeaderBar = true;
    this.pageTitle = titleMap[segment] ?? 'Dashboard';
    this.showModuleToggle =
      (segment === 'dashboard' || segment === 'clients' || segment === 'engagements') &&
      this.allowedModules.length > 1;
    this.showAddClientButton = segment === 'dashboard' || segment === 'clients';
    this.showAddEngagementButton = segment === 'dashboard' || segment === 'engagements';

    if (segment === 'stage-statistics') {
      this.showModuleToggle = false;
      this.showAddClientButton = false;
      this.showAddEngagementButton = false;
    }
  }
}
