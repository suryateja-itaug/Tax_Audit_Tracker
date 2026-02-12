import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ModuleType } from '../data/admin.models';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private moduleSubject = new BehaviorSubject<ModuleType>('audit');
  private refreshSubject = new Subject<void>();
  module$ = this.moduleSubject.asObservable();
  refresh$ = this.refreshSubject.asObservable();

  constructor(private sessionService: SessionService) {
    const [defaultModule] = this.sessionService.getAllowedModules();
    this.moduleSubject.next(defaultModule || 'audit');
  }

  setModule(module: ModuleType) {
    const allowed = this.sessionService.getAllowedModules();
    if (!allowed.includes(module)) {
      return;
    }
    this.moduleSubject.next(module);
  }

  getAllowedModules(): ModuleType[] {
    return this.sessionService.getAllowedModules();
  }

  notifyRefresh(): void {
    this.refreshSubject.next();
  }
}
