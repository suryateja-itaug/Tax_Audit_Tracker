import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-layout.component',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  activeModule: 'audit' | 'tax' = 'audit';
  isMobileView = false;
  isSidebarOpen = false;

  private readonly subscriptions = new Subscription();

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.syncViewportState();
    this.subscriptions.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          if (this.isMobileView) {
            this.isSidebarOpen = false;
          }
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onModuleChange(module: 'audit' | 'tax'): void {
    this.activeModule = module;
  }

  toggleSidebar(): void {
    if (!this.isMobileView) {
      return;
    }
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    if (!this.isMobileView) {
      return;
    }
    this.isSidebarOpen = false;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.syncViewportState();
  }

  private syncViewportState(): void {
    this.isMobileView = window.innerWidth <= 760;
    if (!this.isMobileView) {
      this.isSidebarOpen = false;
    }
  }
}
