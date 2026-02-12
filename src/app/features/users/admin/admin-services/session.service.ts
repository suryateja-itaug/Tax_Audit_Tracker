import { Injectable } from '@angular/core';
import { ModuleType } from '../data/admin.models';

export interface SessionUser {
  name: string;
  role: 'Admin Leader' | 'Audit Leader' | 'Tax Leader' | 'Engagement Manager' | 'Partner';
  domain: 'audit' | 'tax' | 'both';
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly storageKey = 'tat_current_user';

  hasActiveSession(): boolean {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return false;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SessionUser>;
      return (
        !!parsed &&
        typeof parsed.name === 'string' &&
        this.isRole(parsed.role) &&
        this.isDomain(parsed.domain)
      );
    } catch {
      return false;
    }
  }

  getCurrentUser(): SessionUser {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return this.defaultUser();
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SessionUser>;
      if (
        parsed &&
        typeof parsed.name === 'string' &&
        this.isRole(parsed.role) &&
        this.isDomain(parsed.domain)
      ) {
        return {
          name: parsed.name,
          role: parsed.role,
          domain: parsed.domain,
        };
      }
    } catch {
      return this.defaultUser();
    }

    return this.defaultUser();
  }

  setUserFromUsername(username: string): SessionUser {
    const value = username.trim().toLowerCase();
    let user: SessionUser = {
      name: username.trim() || 'User',
      role: 'Engagement Manager',
      domain: 'both',
    };

    if (value.includes('admin')) {
      user = { name: username.trim() || 'Admin Leader', role: 'Admin Leader', domain: 'both' };
    } else if (value.includes('audit')) {
      user = { name: username.trim() || 'Audit Leader', role: 'Audit Leader', domain: 'audit' };
    } else if (value.includes('tax')) {
      user = { name: username.trim() || 'Tax Leader', role: 'Tax Leader', domain: 'tax' };
    } else if (value.includes('partner')) {
      user = { name: username.trim() || 'Partner', role: 'Partner', domain: 'both' };
    }

    localStorage.setItem(this.storageKey, JSON.stringify(user));
    return user;
  }

  clearSession(): void {
    localStorage.removeItem(this.storageKey);
  }

  canManageUsers(): boolean {
    return this.getCurrentUser().role === 'Admin Leader';
  }

  getAllowedModules(): ModuleType[] {
    const { domain } = this.getCurrentUser();
    if (domain === 'both') {
      return ['audit', 'tax'];
    }
    return [domain];
  }

  private defaultUser(): SessionUser {
    return { name: 'Admin Leader', role: 'Admin Leader', domain: 'both' };
  }

  private isRole(value: unknown): value is SessionUser['role'] {
    return (
      value === 'Admin Leader' ||
      value === 'Audit Leader' ||
      value === 'Tax Leader' ||
      value === 'Engagement Manager' ||
      value === 'Partner'
    );
  }

  private isDomain(value: unknown): value is SessionUser['domain'] {
    return value === 'audit' || value === 'tax' || value === 'both';
  }
}
