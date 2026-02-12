import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserModel } from '../data/admin.models';
import { ComponentsMockService } from './components-mock.service';

@Component({
  selector: 'app-components',
  standalone: false,
  templateUrl: './components.html',
  styleUrl: './components.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Components implements OnInit, OnDestroy {
  users: UserModel[] = [];
  loading = true;
  error: string | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private componentsMockService: ComponentsMockService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.componentsMockService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => {
        this.users = users;
        this.cdr.markForCheck();
      });

    this.componentsMockService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.loading = loading;
        this.cdr.markForCheck();
      });

    this.componentsMockService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        this.error = error;
        this.cdr.markForCheck();
      });

    this.componentsMockService.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
