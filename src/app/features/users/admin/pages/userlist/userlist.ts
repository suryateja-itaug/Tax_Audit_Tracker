import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, catchError, of } from 'rxjs';
import { AdminService } from '../../admin-services/admin-services';
import { AdminApiService } from '../../data/admin-api.service';
import { ModuleType, UserModel } from '../../data/admin.models';

@Component({
  selector: 'app-userlist',
  standalone: false,
  templateUrl: './userlist.html',
  styleUrl: './userlist.css',
})
export class Userlist implements OnInit, OnDestroy {
  users: UserModel[] = [];
  selectedUser: UserModel | null = null;
  selectedUserHistory: Array<{
    status: string;
    performedBy: string;
    changedAt: string;
  }> = [];
  selectedModule: ModuleType = 'audit';
  roleFilter = 'all';
  searchTerm = '';
  currentPage = 1;
  readonly pageSize = 8;
  selectedIds = new Set<string>();

  showAddUserForm = false;
  savingNewUser = false;
  errorMessage = '';
  successToast = '';

  readonly roleOptions = ['Admin Leader', 'Audit Leader', 'Tax Leader', 'Engagement Manager', 'Partner'];

  addUserForm = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'Engagement Manager',
    domainAudit: true,
    domainTax: true,
    status: 'Active',
  };
  addUserAvatarPreview = '';
  addUserAvatarName = '';

  private readonly subscriptions = new Subscription();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private todayLabel = new Date().toISOString().slice(0, 10);

  constructor(
    private adminApi: AdminApiService,
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.adminService.module$.subscribe((module) => {
        this.selectedModule = module;
      }),
    );

    this.loadUsers();
    this.subscriptions.add(
      this.adminService.refresh$.subscribe(() => {
        this.loadUsers();
      }),
    );
    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        this.applySelectedUserFromRoute(params.get('id'));
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  setModule(module: ModuleType): void {
    this.selectedModule = module;
    this.adminService.setModule(module);
    this.currentPage = 1;
  }

  openAddUserForm(): void {
    this.selectedUser = null;
    this.errorMessage = '';
    this.showAddUserForm = true;
    this.addUserAvatarPreview = '';
    this.addUserAvatarName = '';
    this.addUserForm = {
      firstName: '',
      lastName: '',
      email: '',
      role: 'Engagement Manager',
      domainAudit: true,
      domainTax: true,
      status: 'Active',
    };
    this.router.navigate(['/admin/users/add']);
  }

  closeAddUserForm(): void {
    if (this.savingNewUser) {
      return;
    }
    this.showAddUserForm = false;
    this.errorMessage = '';
    this.clearRouteToUsers();
  }

  saveUser(): void {
    if (this.savingNewUser) {
      return;
    }

    const first = this.addUserForm.firstName.trim();
    const last = this.addUserForm.lastName.trim();
    const email = this.addUserForm.email.trim().toLowerCase();
    const name = [first, last].filter(Boolean).join(' ').trim();

    if (!first || !last || !email) {
      this.errorMessage = 'First name, last name and email are required.';
      return;
    }

    if (!this.addUserForm.domainAudit && !this.addUserForm.domainTax) {
      this.errorMessage = 'Choose at least one domain access.';
      return;
    }

    this.savingNewUser = true;
    this.errorMessage = '';

    this.subscriptions.add(
      this.adminApi
        .createUser({
          name,
          email,
          role: this.addUserForm.role,
          domain: this.getFormDomain(),
          status: this.addUserForm.status as 'Active' | 'Inactive',
          avatar: this.addUserAvatarPreview || undefined,
        })
        .pipe(catchError((error) => of({ error } as const)))
        .subscribe((result) => {
          this.savingNewUser = false;
          if ('error' in result) {
            const backendMessage = result.error?.error?.message as string | undefined;
            this.errorMessage = backendMessage || 'Failed to create user.';
            return;
          }

          this.showAddUserForm = false;
          this.addUserAvatarPreview = '';
          this.addUserAvatarName = '';
          this.showSuccess('User Added Successfully');
          this.loadUsers();
          this.adminService.notifyRefresh();
          this.clearRouteToUsers();
        }),
    );
  }

  get roleFilterOptions(): string[] {
    return ['all', ...this.roleOptions];
  }

  get filteredUsers(): UserModel[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.users.filter((user) => {
      if (this.roleFilter !== 'all' && user.role !== this.roleFilter) {
        return false;
      }

      if (!(user.domain === 'both' || user.domain === this.selectedModule)) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [user.name, user.email, user.role].some((value) => value.toLowerCase().includes(search));
    });
  }

  get pagedUsers(): UserModel[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  get isAllOnPageSelected(): boolean {
    return this.pagedUsers.length > 0 && this.pagedUsers.every((user) => this.selectedIds.has(user.id));
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

  onFiltersChanged(): void {
    this.currentPage = 1;
  }

  isDomainSelected(domain: ModuleType): boolean {
    return domain === 'audit' ? this.addUserForm.domainAudit : this.addUserForm.domainTax;
  }

  toggleDomainSelection(domain: ModuleType): void {
    if (domain === 'audit') {
      this.addUserForm.domainAudit = !this.addUserForm.domainAudit;
      return;
    }
    this.addUserForm.domainTax = !this.addUserForm.domainTax;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.pagedUsers.forEach((user) => this.selectedIds.add(user.id));
      return;
    }
    this.pagedUsers.forEach((user) => this.selectedIds.delete(user.id));
  }

  toggleSelection(id: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(id);
      return;
    }
    this.selectedIds.delete(id);
  }

  openUserDetail(user: UserModel): void {
    if (this.showAddUserForm) {
      return;
    }
    this.router.navigate(['/admin/users', user.id]);
  }

  triggerDataRefresh(): void {
    this.adminService.notifyRefresh();
    this.loadUsers();
  }

  backToUserList(): void {
    this.selectedUser = null;
    this.selectedUserHistory = [];
    this.clearRouteToUsers();
  }

  selectAvatarFile(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      return;
    }
    this.readAvatarFile(target.files[0]);
    target.value = '';
  }

  onDropAvatar(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }
    this.readAvatarFile(file);
  }

  onDragOverAvatar(event: DragEvent): void {
    event.preventDefault();
  }

  initials(name: string): string {
    const chunks = name.split(' ').filter(Boolean);
    return chunks
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  }

  userAvatarOrInitials(user: UserModel | null): string {
    if (!user) {
      return '';
    }
    return user.avatar && user.avatar.trim().length > 0 ? user.avatar : this.initials(user.name);
  }

  domainTokens(user: UserModel): string[] {
    if (user.domain === 'both') {
      return ['Audit', 'Tax'];
    }
    return [user.domain === 'audit' ? 'Audit' : 'Tax'];
  }

  statusFor(user: UserModel): 'Active' | 'Inactive' {
    if (user.status === 'Active' || user.status === 'Inactive') {
      return user.status;
    }
    if (user.role === 'Engagement Manager' && user.domain === 'tax') {
      return 'Inactive';
    }
    return 'Active';
  }

  lastUpdatedFor(_user: UserModel): string {
    return this.todayLabel;
  }

  private getFormDomain(): 'audit' | 'tax' | 'both' {
    if (this.addUserForm.domainAudit && this.addUserForm.domainTax) {
      return 'both';
    }
    return this.addUserForm.domainAudit ? 'audit' : 'tax';
  }

  private loadUsers(): void {
    this.subscriptions.add(
      this.adminApi
        .getUsers()
        .pipe(catchError(() => of([])))
        .subscribe((users) => {
          this.users = users;
          this.currentPage = Math.min(this.currentPage, this.totalPages);
          const routeId = this.route.snapshot.paramMap.get('id');
          this.applySelectedUserFromRoute(routeId);
        }),
    );
  }

  private applySelectedUserFromRoute(userId: string | null): void {
    if (userId === 'add') {
      this.selectedUser = null;
      this.selectedUserHistory = [];
      this.showAddUserForm = true;
      this.errorMessage = '';
      return;
    }

    if (!userId) {
      this.selectedUser = null;
      this.selectedUserHistory = [];
      this.showAddUserForm = false;
      return;
    }

    const matched = this.users.find((user) => user.id === userId) || null;
    this.selectedUser = matched;
    this.showAddUserForm = false;
    this.errorMessage = '';
    this.selectedUserHistory = matched ? this.buildUserHistory(matched) : [];
  }

  private buildUserHistory(user: UserModel): Array<{
    status: string;
    performedBy: string;
    changedAt: string;
  }> {
    if (user.status !== 'Active' && user.status !== 'Inactive') {
      return [];
    }

    const now = new Date();
    const toIso = (offsetMinutes: number) => {
      const dt = new Date(now.getTime() - offsetMinutes * 60 * 1000);
      return `${dt.getFullYear()}-${`${dt.getMonth() + 1}`.padStart(2, '0')}-${`${dt.getDate()}`.padStart(2, '0')} ${`${dt.getHours()}`.padStart(2, '0')}:${`${dt.getMinutes()}`.padStart(2, '0')}`;
    };

    const currentStatus = this.statusFor(user);
    const previousStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    return [
      { status: `${previousStatus} → ${currentStatus}`, performedBy: 'System', changedAt: toIso(3) },
    ];
  }

  private readAvatarFile(file: File): void {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      this.errorMessage = 'Please upload an image file (PNG, JPG, GIF, SVG).';
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.errorMessage = 'Image size should be 2MB or less.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.addUserAvatarPreview = typeof reader.result === 'string' ? reader.result : '';
      this.addUserAvatarName = file.name;
      this.errorMessage = '';
    };
    reader.onerror = () => {
      this.errorMessage = 'Unable to read image file.';
    };
    reader.readAsDataURL(file);
  }

  private clearRouteToUsers(): void {
    if (this.route.snapshot.paramMap.get('id')) {
      this.router.navigate(['/admin/users']);
    }
  }

  private showSuccess(message: string): void {
    this.successToast = message;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.successToast = '';
      this.toastTimer = null;
    }, 2500);
  }
}
