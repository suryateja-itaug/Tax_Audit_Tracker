import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, catchError, of } from 'rxjs';
import { AdminService } from '../../admin-services/admin-services';
import { AdminApiService } from '../../data/admin-api.service';
import { ClientModel } from '../../data/admin.models';

@Component({
  selector: 'app-clients',
  standalone: false,
  templateUrl: './clients.html',
  styleUrl: './clients.css',
})
export class Clients implements OnInit, OnDestroy {
  clients: ClientModel[] = [];
  searchTerm = '';
  industryFilter = 'all';
  contactFilter = 'all';
  currentPage = 1;
  readonly pageSize = 8;
  selectedClientIds = new Set<string>();
  private readonly subscriptions = new Subscription();

  constructor(
    private adminApi: AdminApiService,
    private adminService: AdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadClients();
    this.subscriptions.add(
      this.adminService.refresh$.subscribe(() => {
        this.loadClients();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  openClientDetail(clientId: string): void {
    this.router.navigate(['/admin/clients', clientId]);
  }

  get industryOptions(): string[] {
    const values = this.clients.map((client) => client.industry).filter(Boolean);
    return ['all', ...Array.from(new Set(values))];
  }

  get contactOptions(): string[] {
    const values = this.clients.map((client) => client.engagementManager).filter(Boolean);
    return ['all', ...Array.from(new Set(values))];
  }

  get filteredClients(): ClientModel[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.clients.filter((client) => {
      if (this.industryFilter !== 'all' && client.industry !== this.industryFilter) {
        return false;
      }

      if (this.contactFilter !== 'all' && client.engagementManager !== this.contactFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [client.name, client.email, client.industry, client.engagementManager].some((value) =>
        value.toLowerCase().includes(search),
      );
    });
  }

  get pagedClients(): ClientModel[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredClients.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredClients.length / this.pageSize));
  }

  get isAllOnPageSelected(): boolean {
    return this.pagedClients.length > 0 && this.pagedClients.every((client) => this.selectedClientIds.has(client.id));
  }

  onFiltersChanged(): void {
    this.currentPage = 1;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.pagedClients.forEach((client) => this.selectedClientIds.add(client.id));
      return;
    }

    this.pagedClients.forEach((client) => this.selectedClientIds.delete(client.id));
  }

  toggleSelection(clientId: string, checked: boolean): void {
    if (checked) {
      this.selectedClientIds.add(clientId);
      return;
    }

    this.selectedClientIds.delete(clientId);
  }

  private loadClients(): void {
    this.subscriptions.add(
      this.adminApi
        .getClients()
        .pipe(catchError(() => of([])))
        .subscribe((clients) => {
          this.clients = clients;
          this.currentPage = 1;
        }),
    );
  }
}
