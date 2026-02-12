import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, catchError, forkJoin, of } from 'rxjs';
import { SessionService } from '../../admin-services/session.service';
import { AdminApiService } from '../../data/admin-api.service';
import { AdminService } from '../../admin-services/admin-services';

type SearchType = 'client' | 'engagement' | 'user' | 'report' | 'page';

interface SearchSuggestion {
  id: string;
  type: SearchType;
  title: string;
  subtitle: string;
  keywords: string[];
  route: string[];
}


@Component({
  selector: 'app-sidebar',
  standalone: false,
  
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Output() mobileNavigate = new EventEmitter<void>();
  searchTerm = '';
  suggestions: SearchSuggestion[] = [];
  showSuggestions = false;

  private readonly subscriptions = new Subscription();
  private searchIndex: SearchSuggestion[] = [];

  constructor(
    public router: Router,
    public sessionService: SessionService,
    private adminApi: AdminApiService,
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.rebuildSearchIndex();
    this.subscriptions.add(
      this.adminService.refresh$.subscribe(() => {
        this.rebuildSearchIndex();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  onNavItemClick(): void {
    this.mobileNavigate.emit();
  }

  logout(): void {
    this.sessionService.clearSession();
    this.mobileNavigate.emit();
    this.router.navigate(['/']);
  }

  onSearchInput(): void {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      this.suggestions = this.defaultSuggestions();
      this.showSuggestions = this.suggestions.length > 0;
      return;
    }

    this.suggestions = this.searchIndex
      .filter((item) => {
        if (item.title.toLowerCase().includes(query) || item.subtitle.toLowerCase().includes(query)) {
          return true;
        }
        return item.keywords.some((keyword) => keyword.toLowerCase().includes(query));
      })
      .slice(0, 8);

    this.showSuggestions = this.suggestions.length > 0;
  }

  onSearchSubmit(): void {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return;
    }

    const exact =
      this.searchIndex.find(
        (item) =>
          item.title.toLowerCase() === query ||
          item.keywords.some((keyword) => keyword.toLowerCase() === query),
      ) || this.suggestions[0];

    if (exact) {
      this.selectSuggestion(exact);
    }
  }

  onSearchFocus(): void {
    if (!this.searchTerm.trim()) {
      this.suggestions = this.defaultSuggestions();
    } else {
      this.onSearchInput();
    }
    this.showSuggestions = this.suggestions.length > 0;
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 140);
  }

  selectSuggestion(item: SearchSuggestion): void {
    this.searchTerm = item.title;
    this.showSuggestions = false;
    this.router.navigate(item.route);
    this.mobileNavigate.emit();
  }

  private rebuildSearchIndex(): void {
    this.subscriptions.add(
      forkJoin({
        clients: this.adminApi.getClients().pipe(catchError(() => of([]))),
        engagements: this.adminApi.getEngagements({}).pipe(catchError(() => of({ items: [] }))),
        users: this.adminApi.getUsers().pipe(catchError(() => of([]))),
        reports: this.adminApi.getReports().pipe(catchError(() => of([]))),
      }).subscribe(({ clients, engagements, users, reports }) => {
        const suggestions: SearchSuggestion[] = [
          {
            id: 'page-dashboard',
            type: 'page',
            title: 'Dashboard',
            subtitle: 'Page',
            keywords: ['dashboard', 'overview'],
            route: ['/admin/dashboard'],
          },
          {
            id: 'page-clients',
            type: 'page',
            title: 'Clients',
            subtitle: 'Page',
            keywords: ['clients', 'client list'],
            route: ['/admin/clients'],
          },
          {
            id: 'page-engagements',
            type: 'page',
            title: 'Engagements',
            subtitle: 'Page',
            keywords: ['engagements', 'tasks'],
            route: ['/admin/engagements'],
          },
          {
            id: 'page-reports',
            type: 'page',
            title: 'Reports',
            subtitle: 'Page',
            keywords: ['reports', 'analytics'],
            route: ['/admin/reports'],
          },
        ];

        clients.forEach((client) => {
          suggestions.push({
            id: `client-${client.id}`,
            type: 'client',
            title: client.name,
            subtitle: `Client · ${client.industry}`,
            keywords: [client.email, client.primaryContact, client.industry, 'client'],
            route: ['/admin/clients', client.id],
          });
        });

        engagements.items.forEach((engagement) => {
          suggestions.push({
            id: `engagement-${engagement.id}`,
            type: 'engagement',
            title: engagement.name,
            subtitle: `Engagement · ${engagement.clientName}`,
            keywords: [engagement.clientName, engagement.type, engagement.period, engagement.status],
            route: ['/admin/engagements', engagement.id],
          });
        });

        if (this.sessionService.canManageUsers()) {
          suggestions.push({
            id: 'page-users',
            type: 'page',
            title: 'User Management',
            subtitle: 'Page',
            keywords: ['users', 'user management'],
            route: ['/admin/users'],
          });

          users.forEach((user) => {
            suggestions.push({
              id: `user-${user.id}`,
              type: 'user',
              title: user.name,
              subtitle: `User · ${user.role}`,
              keywords: [user.email, user.role, user.domain, 'user'],
              route: ['/admin/users', user.id],
            });
          });
        }

        reports.forEach((report) => {
          suggestions.push({
            id: `report-${report.id}`,
            type: 'report',
            title: report.name,
            subtitle: `Report · ${report.module}`,
            keywords: [report.module, 'report'],
            route: ['/admin/reports'],
          });
        });

        this.searchIndex = suggestions;
        if (!this.searchTerm.trim()) {
          this.suggestions = this.defaultSuggestions();
        } else {
          this.onSearchInput();
        }
      }),
    );
  }

  private defaultSuggestions(): SearchSuggestion[] {
    return this.searchIndex.filter((item) => item.type === 'page').slice(0, 6);
  }
}
