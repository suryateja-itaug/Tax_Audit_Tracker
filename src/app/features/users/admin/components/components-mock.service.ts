import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, take } from 'rxjs/operators';
import { UserModel } from '../data/admin.models';
import { AdminApiService } from '../data/admin-api.service';

@Injectable({
  providedIn: 'root',
})
export class ComponentsMockService {
  private readonly usersSubject = new BehaviorSubject<UserModel[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  readonly users$: Observable<UserModel[]> = this.usersSubject.asObservable();
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();
  readonly error$: Observable<string | null> = this.errorSubject.asObservable();

  constructor(private adminApi: AdminApiService) {}

  loadUsers(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.adminApi
      .getUsers()
      .pipe(
        take(1),
        catchError(() => {
          this.errorSubject.next('Unable to load users from mock backend.');
          this.usersSubject.next([]);
          return of([] as UserModel[]);
        }),
        finalize(() => {
          this.loadingSubject.next(false);
        }),
      )
      .subscribe((users) => {
        this.usersSubject.next(users);
      });
  }
}
